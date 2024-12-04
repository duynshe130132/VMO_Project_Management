import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { MailerService } from '../_shared/mailer/mailer.service';
import { ConfigService } from '@nestjs/config';
import { RolesService } from '../roles/roles.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import * as jwt from 'jsonwebtoken';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import ms from 'ms';
import { ChangePasswordDto, RequestResetPasswordDto, ResetPasswordDto } from '../users/dto/authentication-dto.';
import { IUser } from '../users/user.interface';

@Injectable()
export class AuthService {
    constructor(
        @Inject(forwardRef(() => UsersService))
        private readonly userService: UsersService,
        private mailerService: MailerService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private roleService: RolesService,
    ) { }

    async login(user: any, response: Response) {
        try {
            const result = await this.generateAndSendTokens(user, response);
            return result;
        } catch (error) {
            throw new InternalServerErrorException('An error occurred during login. Please try again later.');
        }
    }

    processNewToken = async (refreshToken: string, response: Response) => {
        try {
            this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_TOKEN')
            })
            let user = await this.userService.findUserByToken(refreshToken)
            console.log(user)
            if (user) {
                response.clearCookie('refresh_token');
                //update refresh token
                const result = await this.generateAndSendTokens(user, response);
                return result;
            }
            else {
                throw new BadRequestException('Refresh token is invalid')
            }
        }
        catch (error) {
            throw new BadRequestException('Refresh token is invalid, please login');
        }
    }

    async requestForgetPassword(requestResetPassword: RequestResetPasswordDto) {
        try {
            const user = await this.userService.findByEmail(requestResetPassword.email);
            if (!user) {
                throw new BadRequestException("Couldn't find user")
            }
            const secret = this.configService.get<string>('JWT_FORGOT_PASSWORD_ACCESS_TOKEN');
            const expireIn = ms(this.configService.get<string>('JWT_FORGOT_PASSWORD_EXPIRE')) / 1000

            const token = this.jwtService.sign(
                { email: user.email },
                {
                    secret: secret,
                    expiresIn: expireIn
                }

            );

            const resetPasswordLink = `http://your-actual-domain.com/reset-password?token=${token}`;

            const mailOptions = await this.mailerService.generateResetPasswordEmail(user.email, resetPasswordLink);
            await this.mailerService.sendMail(mailOptions);
        }
        catch (error) {
            throw new InternalServerErrorException('An error occurred while processing the password reset request');
        }
    }


    async resetPassword(token: string, resetPasswordDto: ResetPasswordDto) {
        const prefixes = ['Bearer ', 'Token ', 'JWT ', 'Authorization '];

        console.log("Check Token: ", token);
        let tokenWithoutPrefix = token;
        for (const prefix of prefixes) {
            if (tokenWithoutPrefix.startsWith(prefix)) {
                tokenWithoutPrefix = tokenWithoutPrefix.slice(prefix.length);
                break;
            }
        }
        let decoded;
        try {
            decoded = jwt.verify(tokenWithoutPrefix, this.configService.get<string>('JWT_FORGOT_PASSWORD_ACCESS_TOKEN'));
        }
        catch (error) {
            throw new BadRequestException(error.message);
        }
        const email = decoded.email;
        const user = await this.userService.findByEmail(email);
        if (!user) throw new BadRequestException('user not found');

        const hashPassword = await this.userService.hashPassword(resetPasswordDto.password)

        await this.userService.updatePassword(user._id.toString(), hashPassword);
    }


    changePassword = async (changePasswordDto: ChangePasswordDto, payload: any) => {
        try {
            await this.userService.changePassword(changePasswordDto, payload)
            return "change password successfully ";
        }
        catch (error) {
            throw new BadRequestException(error.message || "Failed to change password")
        }
    }

    logout = async (response: Response, user: IUser) => {
        try {
            await this.userService.updateUserToken("", user._id);
            response.clearCookie('refresh_token');
            return "Logout successful";
        } catch (error) {
            throw new InternalServerErrorException('An error occurred during logout. Please try again later.');
        }
    }

    ////////////////////////////////////////////////////////////////////

    async validateUser(email: string, password: string): Promise<any> {
        const user = await this.userService.findByEmail(email);
        if (user) {
            const isValid = await this.userService.isValidPassword(password, user.password);
            if (isValid) {
                const userRole = user.roleId as unknown as { _id: string, name: string };
                const temp = await this.roleService.findOne(userRole._id);
                const objUser = {
                    ...user.toObject(),
                    roleName: temp.name,
                    permissions: temp?.permissionId ?? []
                }
                return objUser;
            }
        }
        return null;
    }

    async generateAndSendTokens(user: any, response: Response) {
        const { _id, name, email, roleId, roleName, permissions } = user;
        const payload = {
            sub: "token login",
            iss: "from server",
            _id,
            name,
            email,
            roleId,
            roleName
        }
        const refreshToken = this.createRefreshToken(payload);
        await this.userService.updateUserToken(refreshToken, _id)
        response.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            maxAge: ms(this.configService.get<string>('JWT_REFRESH_EXPIRE'))
        });
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                _id, name, email, roleId, roleName, permissions
            }
        }
    }

    createRefreshToken = (payload: any) => {
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_TOKEN'),
            expiresIn: ms(this.configService.get<string>('JWT_REFRESH_EXPIRE')) / 1000
        });
        return refreshToken;
    }

    async createUserToken(createUserDto: CreateUserDto): Promise<string> {
        const payload = { ...createUserDto };
        const token = this.jwtService.sign(payload, {
            expiresIn: '1h',
        });
        return token;
    }

    async decodeToken(token: string) {
        const decoded = await this.jwtService.verify(token);
        console.log(decoded)
        return decoded;
    }

}
