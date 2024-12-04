import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreatePermissionDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    apiPath: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    method: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    module: string;
}
