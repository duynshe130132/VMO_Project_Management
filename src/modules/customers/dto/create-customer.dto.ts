import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CreateCustomerDto {
    @ApiProperty({ description: "Customer's name" })
    @IsNotEmpty({ message: "Customer's name cannot empty" })
    name: string;

    @ApiProperty({ description: "Customer's phone" })
    @IsNotEmpty({ message: "Customer's phone cannot empty" })
    @IsString()
    phone: string;

    @ApiProperty({ description: "Customer's email" })
    @IsEmail({}, { message: "invalid email format" })
    @IsNotEmpty({ message: "Customer's email cannot empty" })
    email: string;
}
