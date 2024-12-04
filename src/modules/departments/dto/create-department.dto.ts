import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsDate, IsMongoId, IsNotEmpty, IsOptional, Validate } from "class-validator";
import mongoose from "mongoose";
import { DateValidator } from "src/modules/_shared/validate/validate.pipe";

export class CreateDepartmentDto {
    @ApiProperty()
    @IsNotEmpty()
    name: string;

    @ApiProperty()
    @IsNotEmpty()
    description: string;

    @ApiProperty()
    @IsNotEmpty()
    @Type(() => Date)
    @Validate(DateValidator)
    foundingDate: Date;

    @ApiProperty({ type: String })
    @IsNotEmpty()
    @IsOptional()
    @IsMongoId()
    user_managerId: string;

    @ApiProperty({ type: [String] })
    @IsOptional()
    @IsMongoId({ each: true })
    projectId: string[];
}
