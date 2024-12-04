import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RolesService } from '../roles/roles.service';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private roleService: RolesService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_ACCESS_TOKEN'),
        });
    }


    async validate(payload: any) {
        const { _id, name, email, roleId } = payload;
        const userRole = roleId as unknown as { _id: string, name: string }
        const temp = await this.roleService.findOne(userRole.toString());
        return {
            _id,
            name,
            email,
            roleId,
            roleName: temp.name,
            permissions: temp?.permissionId ?? []
        };
    }
}
