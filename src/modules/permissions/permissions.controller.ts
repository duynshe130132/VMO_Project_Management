import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { IUser } from '../users/user.interface';
import { User } from 'src/decorator/user.decorator';
import { ResponseMessage } from 'src/decorator/response-message.decorator';
import { PaginatedQuery } from 'src/decorator/query-params.decorator';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) { }

  @ResponseMessage("Create new permission")
  @Post()
  create(@Body() createPermissionDto: CreatePermissionDto, @User() user: IUser) {
    return this.permissionsService.create(createPermissionDto, user);
  }

  @ResponseMessage("Get all permissions")
  @Get()
  @PaginatedQuery()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('qs') qs: string) {
    return this.permissionsService.findAll(page, limit, qs);
  }

  @ResponseMessage("Get permission by id")
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @ResponseMessage("Update permission")
  @Patch()
  update(@Body() updatePermissionDto: UpdatePermissionDto, @User() user: IUser) {
    return this.permissionsService.update(updatePermissionDto, user);
  }

  @ResponseMessage("Delete permission")
  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.permissionsService.remove(id, user);
  }
}
