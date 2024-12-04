import { Injectable } from '@nestjs/common';
import { ISendMailOptions } from './send-mail-options.interface';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailerService {
    constructor(private configService: ConfigService) { }
    private transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: this.configService.get<string>('GMAIL_CONTACT'),
            pass: this.configService.get<string>('GMAIL_PASSWORD'),
        },
    });

    async sendMail(mailOptions: ISendMailOptions) {
        await this.transporter.sendMail(mailOptions);
    }

    generateResetPasswordEmail(to: string, resetPasswordLink: string): ISendMailOptions {
        return {
            to,
            subject: 'Reset Your Password',
            html: `
                <p>Click here to reset your password.</p>
                <p>Link expires in 5 minutes.</p>
                <p><a href="${resetPasswordLink}">Reset Password</a></p>
            `,
        };
    }

    generateRegisterEmail(to: string, userName: string, password: string): ISendMailOptions {
        return {
            to,
            subject: 'Account Created',
            html: `
            <p>Your account has been created successfully.</p>
            <p>Here is your username: <strong>${userName}</strong></p>
            <p>Here is your temporary password: <strong>${password}</strong></p>
            <p>Please click on the link below to change your password:</p>
          `,
        };
    }

    generateSendRequestRegister(to: string, resetPasswordLink: string): ISendMailOptions {
        return {
            to,
            subject: 'New User Registration Request',
            html: `
              <p>A new user has requested to be registered. Please review the request.</p>
              <p>Click the link below to review the registration:</p>
              <p><a href="${resetPasswordLink}">Create new user</a></p>
              <p>If you want to reject, you can simply ignore this email.</p>
          `,
        };
    }
}
