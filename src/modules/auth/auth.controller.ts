import { Controller, Post, Body, UseGuards, Req, Res, Get, Patch, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ResponseMessage } from 'src/decorator/response-message.decorator';
import { LocalAuthGuard } from '../_shared/guards/local-auth.guard';
import { ChangePasswordDto, LoginDto, RequestResetPasswordDto, ResetPasswordDto } from '../users/dto/authentication-dto.';
import { ApiBody, ApiHeader } from '@nestjs/swagger';
import { Public } from 'src/decorator/is-public.decorator';
import { Response, Request } from 'express';
import { User } from 'src/decorator/user.decorator';
import { IUser } from '../users/user.interface';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @ResponseMessage("User Login")
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  @ApiBody({ type: LoginDto })
  login(
    @Req() req,
    @Res({ passthrough: true }) response: Response) {
    return this.authService.login(req.user, response);
  }

  @Public()
  @ResponseMessage("Get User By Refresh Token")
  @Get('/refresh')
  handleRefreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response) {
    const refreshToken = request.cookies["refresh_token"];
    return this.authService.processNewToken(refreshToken, response);
  }

  @Public()
  @ResponseMessage("Request reset password")
  @Post('/request-forget-password')
  async requestResetPassword(@Body() dto: RequestResetPasswordDto) {
    await this.authService.requestForgetPassword(dto);
    return { message: 'Reset password link has been sent to your email.' };

  }

  @Public()
  @ResponseMessage("Reset password")
  @Patch('/reset-password')
  async resetPassword(@Headers('authorization') token: string, @Body() resetPassword: ResetPasswordDto) {
    await this.authService.resetPassword(token, resetPassword);
    return { message: 'Reset password successfully.' };
  }

  @ResponseMessage("Change password")
  @Patch('/change-password')
  changePassword(@Body() changePasswordDto: ChangePasswordDto, @Req() req) {
    return this.authService.changePassword(changePasswordDto, req.user);
  }

  @ResponseMessage("Logout user")
  @Post('/logout')
  handleLogout(
    @Res({ passthrough: true }) response: Response,
    @User() user: IUser
  ) {
    return this.authService.logout(response, user)
  }
}
