import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schema/user.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { PaginationService } from '../_shared/paginate/pagination.service';
import { DepartmentsModule } from '../departments/departments.Module';
import { ProjectsModule } from '../projects/projects.module';
import { Project, ProjectSchema } from '../projects/schema/project.schema';
import { Department, DepartmentSchema } from '../departments/schema/department.schema';
import { UserRelationshipService } from './user-relationship.service';
import { MailerModule } from '../_shared/mailer/mailer.module';
import { AuthModule } from '../auth/auth.Module';

@Module({
  imports: [forwardRef(() => DepartmentsModule), forwardRef(() => ProjectsModule),
  MongooseModule.forFeature([{ name: User.name, schema: UserSchema },
  { name: Project.name, schema: ProjectSchema },
  { name: Department.name, schema: DepartmentSchema }
  ]),
    MailerModule, forwardRef(() => AuthModule)
  ],
  controllers: [UsersController],
  providers: [UsersService, PaginationService, UserRelationshipService],
  exports: [UsersService, MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),]
})
export class UsersModule { }
