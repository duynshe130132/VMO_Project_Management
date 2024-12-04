import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { StatusService } from './status.service';
import { CreateStatusDto } from './dto/create-status.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ResponseMessage } from 'src/decorator/response-message.decorator';
import { User } from 'src/decorator/user.decorator';
import { IUser } from '../users/user.interface';
import { PaginatedQuery } from 'src/decorator/query-params.decorator';

@Controller('status')
export class StatusController {
  constructor(private readonly statusService: StatusService) { }

  @ResponseMessage('Create status')
  @Post()
  create(@Body() createStatusDto: CreateStatusDto, @User() user: IUser) {
    return this.statusService.create(createStatusDto, user);
  }

  @ResponseMessage('List all status')
  @PaginatedQuery()
  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('qs') qs: string,
  ) {
    return this.statusService.findAll(page, limit, qs);
  }

  @ResponseMessage('Get status by id')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.statusService.findOne(id);
  }

  @ResponseMessage('Update status')
  @Patch()
  update(@Body() updateStatusDto: UpdateStatusDto, @User() user: IUser) {
    return this.statusService.update(updateStatusDto, user);
  }

  @ResponseMessage('Delete status')
  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.statusService.remove(id, user);
  }
}
