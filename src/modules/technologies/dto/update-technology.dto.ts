import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateTechnologyDto } from './create-technology.dto';

export class UpdateTechnologyDto extends PartialType(CreateTechnologyDto) {
    @ApiProperty()
    _id: string;
}
