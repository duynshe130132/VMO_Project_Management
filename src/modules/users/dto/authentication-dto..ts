import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
    @ApiProperty()
    @IsEmail()
    @IsNotEmpty()
    username: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    password: string;
}

export class ChangePasswordDto {
    @ApiProperty()
    @IsNotEmpty()
    oldPassword: string;

    @ApiProperty()
    @IsNotEmpty()
    newPassword: string;

    @ApiProperty()
    @IsNotEmpty()
    re_newPassword: string;
}

export class RequestResetPasswordDto {
    @ApiProperty()
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

export class ResetPasswordDto {
    @ApiProperty()
    @IsNotEmpty()
    password: string;
}
