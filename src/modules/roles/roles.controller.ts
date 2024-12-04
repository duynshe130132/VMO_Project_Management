import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ResponseMessage } from 'src/decorator/response-message.decorator';
import { PaginatedQuery } from 'src/decorator/query-params.decorator';
import { User } from 'src/decorator/user.decorator';
import { IUser } from '../users/user.interface';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) { }

  @ResponseMessage("Create new role")
  @Post()
  create(@Body() createRoleDto: CreateRoleDto, @User() user: IUser) {
    return this.rolesService.create(createRoleDto, user);
  }

  @ResponseMessage("List all role")
  @PaginatedQuery()
  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('qs') qs: string,
  ) {
    return this.rolesService.findAll(page, limit, qs);
  }

  @ResponseMessage("Get role by id")
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @ResponseMessage("Update role")
  @Patch()
  update(@Body() updateRoleDto: UpdateRoleDto, @User() user: IUser) {
    return this.rolesService.update(updateRoleDto, user);
  }

  @ResponseMessage("Remove role")
  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.rolesService.remove(id, user);
  }
}
