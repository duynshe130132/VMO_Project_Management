import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateProjecttypeDto } from './create-projecttype.dto';

export class UpdateProjecttypeDto extends PartialType(CreateProjecttypeDto) {
    @ApiProperty()
    _id: string;
}
