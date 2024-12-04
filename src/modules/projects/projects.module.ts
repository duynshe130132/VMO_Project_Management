import { forwardRef, Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from './schema/project.schema';
import { PaginationService } from '../_shared/paginate/pagination.service';
import { DepartmentsModule } from '../departments/departments.Module';
import { UsersModule } from '../users/users.Module';
import { ProjectRelationshipService } from './project-relationship.service';
import { Department, DepartmentSchema } from '../departments/schema/department.schema';
import { ProjecttypesModule } from '../projecttypes/projecttypes.module';
import { StatusModule } from '../status/status.module';
import { TechnologiesModule } from '../technologies/technologies.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema },
    , { name: Department.name, schema: DepartmentSchema }
  ]), DepartmentsModule, forwardRef(() => UsersModule), ProjecttypesModule, StatusModule, TechnologiesModule, CustomersModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, PaginationService, ProjectRelationshipService],
  exports: [ProjectsService, MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema },])]
})
export class ProjectsModule { }
