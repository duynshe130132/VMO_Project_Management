import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginatedQuery } from 'src/decorator/query-params.decorator';
import { ResponseMessage } from 'src/decorator/response-message.decorator';
import { IUser } from './user.interface';
import { User } from 'src/decorator/user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  //Admin (OKE)
  @ResponseMessage("Register user")
  @Post('/register')
  create(@Body() createUserDto: CreateUserDto, @User() user: IUser) {
    return this.usersService.register(createUserDto, user);
  }
  //manager (OKE)
  @ResponseMessage("Manager send request create new user")
  @Post('/request-create-user')
  requestCreateUser(@User() user: IUser, @Body() createUserDto: CreateUserDto) {
    return this.usersService.sendRequestCreateForAdmin(user, createUserDto);
  }
  //Admin(OKE)
  @ResponseMessage("Preview request create user")
  @Get('/preview-registration')
  preview_requestCreateUser(@Query('token') token: string) {
    return this.usersService.preview_requestCreateUser(token);
  }
  //Admin (OKE)
  @ResponseMessage('Accept request to create user')
  @Post('/accept-request-create-user')
  acceptRequestCreateUser(@Query('token') token: string, @User() user: IUser) {
    return this.usersService.acceptRequestCreateUser(token, user);
  }
  //Admin (OKE)
  @ResponseMessage('Reject request to create user')
  @Post('/reject-request-create-user')
  rejectRequestCreateUser(@Query('token') token: string) {
    return this.usersService.rejectRequestCreateUser(token);
  }

  @ResponseMessage("Get User Profile")
  @Get('/profile')
  getProfile(@User() user: IUser) {
    return this.usersService.handleGetProfile(user);
  }
  //admin routes
  @ResponseMessage("List all users")
  @Get()
  @PaginatedQuery()
  findAll(@Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('qs') qs: string) {
    return this.usersService.findAll(page, limit, qs);
  }

  //All
  @ResponseMessage("Get user by id")
  @Get(':id')
  findOne(@Param('id') id: string, @User() user: IUser) {
    return this.usersService.getUserById(id, user);
  }

  //admin 
  @ResponseMessage("List all users by role Id")
  @Get('/role/:id')
  @PaginatedQuery()
  findAllByRole(@Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('qs') qs: string,
    @Query('id') id: string) {
    return this.usersService.findAllByRole(id, page, limit, qs);
  }

  //All
  @ResponseMessage("List all users by department Id")
  @Get('/department/:id')
  @PaginatedQuery()
  findAllByDepartmentId(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('qs') qs: string,
    @Query('id') id: string,
    @User() user: IUser) {
    return this.usersService.findAllByDepartmentId(user, id, page, limit, qs);
  }

  //All
  @ResponseMessage("List all User by project id")
  @PaginatedQuery()
  @Get('/project/:id')
  findByProjectId(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('qs') qs: string,
    @Param('id') id: string,
    @User() user: IUser) {
    return this.usersService.listAllUserByProjectId(id, user, page, limit, qs);
  }

  //admin 
  @ResponseMessage("Update user")
  @Patch()
  update(@Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(updateUserDto);
  }

  //admin 
  @ResponseMessage("Delete user")
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

}
