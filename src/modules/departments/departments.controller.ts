import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ConsoleLogger } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { ResponseMessage } from 'src/decorator/response-message.decorator';
import { PaginatedQuery } from 'src/decorator/query-params.decorator';
import { User } from 'src/decorator/user.decorator';
import { IUser } from '../users/user.interface';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) { }

  //admin
  @ResponseMessage('Create new department')
  @Post()
  create(@Body() createDepartmentDto: CreateDepartmentDto, @User() user: IUser) {
    return this.departmentsService.create(createDepartmentDto, user);
  }

  //All
  @ResponseMessage('List all department')
  @PaginatedQuery()
  @Get()
  findAll(@Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('qs') qs: string,
    @User() user: IUser) {
    return this.departmentsService.listAllDepartment(user, page, limit, qs);
  }

  //All
  @ResponseMessage('Get department by id')
  @Get(':id')
  findOne(@Param('id') id: string, @User() user: IUser) {
    return this.departmentsService.getById(id, user);
  }

  //admin
  @ResponseMessage('Update department')
  @Patch()
  update(@Body() updateDepartmentDto: UpdateDepartmentDto, @User() user: IUser) {
    return this.departmentsService.update(updateDepartmentDto, user);
  }
  //admin
  @ResponseMessage('Remove department')
  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.departmentsService.remove(id, user);
  }


}
