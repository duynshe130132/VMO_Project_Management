import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import mongoose from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Customer, CustomerDocument } from './schema/customer.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { PaginationService } from '../_shared/paginate/pagination.service';
import { IUser } from '../users/user.interface';
import { CustomerRelationshipService } from './customer-relationship.service';

@Injectable()
export class CustomersService {

  constructor(@InjectModel(Customer.name)
  private customerModel: SoftDeleteModel<CustomerDocument>,
    private relationService: CustomerRelationshipService,
    private paginationService: PaginationService) { }

  async create(createCustomerDto: CreateCustomerDto, user: IUser) {
    const name = await this.customerModel.findOne({ name: createCustomerDto.name });
    if (name) throw new BadRequestException('Customer already exists');

    const newCustomer = await this.customerModel.create({ ...createCustomerDto, createdBy: user._id });
    return newCustomer;
  }

  async findAll(currentPage: number, limit: number, qs: string) {
    const customers = await this.customerModel.find();
    return await this.paginationService.getPagination(customers, currentPage, limit, qs);
  }

  async findOne(id: string) {
    const customer = await this.CustomerExist(id);
    return customer;
  }

  async update(updateCustomerDto: UpdateCustomerDto, user: IUser) {
    await this.CustomerExist(updateCustomerDto._id);

    const updatedCustomer = await this.customerModel.updateOne(
      { _id: updateCustomerDto._id },
      { ...updateCustomerDto, updatedBy: user._id },
      { new: true }
    )
    return updatedCustomer;
  }

  async remove(id: string, user: IUser) {
    const isRelation = await this.relationService.checkCustomerRelations(id);
    if (isRelation)
      throw new BadRequestException("Can't remove customer because it's linked to project");
    await this.CustomerExist(id);
    await this.customerModel.updateOne({ _id: id }, { deletedBy: user._id });
    const removeCustomer = await this.customerModel.softDelete({ _id: id });
    return "Delete successfully";
  }

  async CustomerExist(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid id mongooo');
    }
    const department = await this.customerModel.findOne({
      _id: id,
      $or: [
        { isDeleted: { $exists: false } },
        { isDeleted: false },
      ],
    });
    if (!department) throw new BadRequestException('Not found customer');
    return department;
  }

  async isIdCustomerExist(id: string) {
    const customer = await this.customerModel.findOne({ _id: id });
    if (customer) return true;

    return false;
  }
}
