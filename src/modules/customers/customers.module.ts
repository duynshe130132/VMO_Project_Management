import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Customer, CustomerSchema } from './schema/customer.schema';
import { PaginationService } from '../_shared/paginate/pagination.service';
import { Project, ProjectSchema } from '../projects/schema/project.schema';
import { CustomerRelationshipService } from './customer-relationship.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Customer.name, schema: CustomerSchema },
  { name: Project.name, schema: ProjectSchema }
  ])],
  controllers: [CustomersController],
  providers: [CustomersService, PaginationService, CustomerRelationshipService],
  exports: [CustomersService]
})
export class CustomersModule { }
