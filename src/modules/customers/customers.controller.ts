import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { User } from 'src/decorator/user.decorator';
import { IUser } from '../users/user.interface';
import { PaginatedQuery } from 'src/decorator/query-params.decorator';
import { ResponseMessage } from 'src/decorator/response-message.decorator';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) { }

  @ResponseMessage("Create new customer")
  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto, @User() user: IUser) {
    return this.customersService.create(createCustomerDto, user);
  }

  @ResponseMessage("List all customers")
  @Get()
  @PaginatedQuery()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('qs') qs: string,
  ) {
    return this.customersService.findAll(page, limit, qs);
  }

  @ResponseMessage("Get customer by id")
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @ResponseMessage("Update customer")
  @Patch()
  update(@Body() updateCustomerDto: UpdateCustomerDto, @User() user: IUser) {
    return this.customersService.update(updateCustomerDto, user);
  }

  @ResponseMessage("Delete customer")
  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.customersService.remove(id, user);
  }
}
