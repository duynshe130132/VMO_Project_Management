import { ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from 'src/decorator/is-public.decorator';
import { Request } from 'express';


@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {


    constructor(private reflector: Reflector) {
        super();
    }
    canActivate(context: ExecutionContext) {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        return super.canActivate(context);
    }

    handleRequest(err, user, info, context: ExecutionContext) {
        const request: Request = context.switchToHttp().getRequest();
        if (err || !user) {
            throw err || new UnauthorizedException("tOKEN KHONG HOP LE");
        }
        //  check permission
        const targetMethod = request.method.toUpperCase();

        const targetEndpoint = request.route?.path?.toLowerCase() as string;

        const permissions = user?.permissions ?? [];

        let isExist = permissions.find(permission =>
            targetMethod === permission.method.toUpperCase()
            && targetEndpoint === permission.apiPath.toLowerCase()
        );
        if (targetEndpoint.startsWith('/api/v1/auth')) isExist = true;
        if (!isExist) {
            throw new ForbiddenException("Không có quyền để truy cập end point này")
        }
        return user;
    }
}
