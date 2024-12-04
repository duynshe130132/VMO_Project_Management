import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TechnologiesService } from './technologies.service';
import { CreateTechnologyDto } from './dto/create-technology.dto';
import { UpdateTechnologyDto } from './dto/update-technology.dto';
import { ResponseMessage } from 'src/decorator/response-message.decorator';
import { IUser } from '../users/user.interface';
import { User } from 'src/decorator/user.decorator';
import { PaginatedQuery } from 'src/decorator/query-params.decorator';

@Controller('technologies')
export class TechnologiesController {
  constructor(private readonly technologiesService: TechnologiesService) { }

  @ResponseMessage('Create technology')
  @Post()
  create(@Body() createTechnologyDto: CreateTechnologyDto, @User() user: IUser) {
    return this.technologiesService.create(createTechnologyDto, user);
  }

  @ResponseMessage('List all technology')
  @Get()
  @PaginatedQuery()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 2,
    @Query('qs') qs: string,
  ) {
    return this.technologiesService.findAll(page, limit, qs);
  }

  @ResponseMessage('Get technology by id')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.technologiesService.findOne(id);
  }

  @ResponseMessage('Update technology')
  @Patch()
  update(@Body() updateTechnologyDto: UpdateTechnologyDto, @User() user: IUser) {
    return this.technologiesService.update(updateTechnologyDto, user);
  }

  @ResponseMessage('Delete technology')
  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.technologiesService.remove(id, user);
  }
}
