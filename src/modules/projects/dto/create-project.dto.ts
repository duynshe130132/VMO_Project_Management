import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNotEmpty, IsString, IsDate, IsArray, IsOptional, IsMongoId, Validate } from "class-validator";
import mongoose from "mongoose";
import { DateValidator, EndDateValidator } from "src/modules/_shared/validate/validate.pipe";

export class CreateProjectDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    description: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsDate()
    @Type(() => Date)
    @Validate(DateValidator)
    startDate: Date;

    @ApiProperty()
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    @Validate(EndDateValidator)
    endDate: Date;

    @ApiProperty({ type: String })
    @IsMongoId({ each: true })
    projectTypeId: string;

    @ApiProperty({ type: String })
    @IsNotEmpty()
    @IsMongoId()
    statusId: string;

    @ApiProperty({ type: [String] })
    @IsArray()
    @IsMongoId({ each: true })
    technologyId: string[];

    @ApiProperty()
    @IsArray()
    @IsMongoId({ each: true })
    userId: string[];

    @ApiProperty({ type: String })
    @IsNotEmpty()
    @IsMongoId()
    customerId: string;
}
