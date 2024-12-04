import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MailerModule } from '../_shared/mailer/mailer.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import ms from 'ms';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.Module';
import { LocalStrategy } from './local.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { RolesModule } from '../roles/roles.module';


@Module({
  imports: [MailerModule, forwardRef(() => UsersModule), PassportModule, RolesModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_ACCESS_TOKEN');
        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn: ms(configService.get<string>('JWT_ACCESS_EXPIRE')),
          },
        };
      },
      inject: [ConfigService],
    }),

  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService]
})
export class AuthModule { }
