import { forwardRef, Module } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { DepartmentsController } from './departments.controller';
import { Department, DepartmentSchema } from './schema/department.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { PaginationService } from '../_shared/paginate/pagination.service';
import { UsersModule } from '../users/users.Module';
import { DepartmentRelationshipService } from './department-relationship.service';
import { UserSchema } from '../users/schema/user.schema';
import { User } from 'src/decorator/user.decorator';

@Module({
  imports: [forwardRef(() => UsersModule), MongooseModule.forFeature([{ name: Department.name, schema: DepartmentSchema }
    , { name: User.name, schema: UserSchema },
  ])],
  controllers: [DepartmentsController],
  providers: [DepartmentsService, PaginationService, DepartmentRelationshipService],
  exports: [DepartmentsService, MongooseModule.forFeature([{ name: Department.name, schema: DepartmentSchema }])]
})
export class DepartmentsModule { }
