import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsEmail, IsString, IsDate, IsArray, IsOptional, IsMongoId, Validate, IsNumber, IsUrl } from "class-validator";
import mongoose from "mongoose";
import { Type, Exclude } from 'class-transformer';
import { CmtValidator, DateOfBirthValidator, DateValidator, NameValidator, PhoneValidator } from "src/modules/_shared/validate/validate.pipe";

export class Certificate {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsDate()
    @Type(() => Date)
    @Validate(DateValidator)
    year: Date;

    @ApiProperty()
    @IsOptional()
    @IsString()
    @IsUrl()
    url: string;
}

export class CreateUserDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @Validate(NameValidator)
    name: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsDate()
    @Type(() => Date)
    @Validate(DateOfBirthValidator)
    dateOfBirth: Date;

    @ApiProperty()
    @IsOptional()
    @IsString()
    address: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    @Validate(CmtValidator)
    cccd: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    @Validate(PhoneValidator)
    phone: string;

    @ApiProperty({ type: [String] })
    @IsArray()
    @IsMongoId({ each: true })
    technologyId: string[];

    @ApiProperty({ type: String })
    @IsNotEmpty()
    @IsMongoId({ each: true })
    roleId: string;

    @ApiProperty()
    @IsNumber()
    yearExp: number;

    @ApiProperty({ type: [String] })
    @Exclude({ toPlainOnly: true })
    @IsString({ each: true })
    language: string[];

    @ApiProperty({ type: [Certificate] })
    @IsOptional()
    @Exclude({ toPlainOnly: true })
    @IsArray()
    @Type(() => Certificate)
    certificate?: Certificate[];

    @ApiProperty({ type: [String] })
    @IsNotEmpty()
    @IsMongoId({ each: true })
    departmentId: string[];
}
