import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateStatusDto } from './create-status.dto';

export class UpdateStatusDto extends PartialType(CreateStatusDto) {
    @ApiProperty()
    _id: string;
}
