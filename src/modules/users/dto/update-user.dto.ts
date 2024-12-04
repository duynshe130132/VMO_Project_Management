import { CreateUserDto } from './create-user.dto';
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';

export class UpdateUserDto extends OmitType(
    PartialType(CreateUserDto),
    ['email', 'cccd'] as const
) {
    @ApiProperty()
    _id: string;
}