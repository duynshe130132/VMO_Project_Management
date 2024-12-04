import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from './schema/role.schema';
import { PaginationService } from '../_shared/paginate/pagination.service';
import { RoleRelationshipService } from './role-relationship.service';
import { User, UserSchema } from '../users/schema/user.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema },
  { name: User.name, schema: UserSchema }
  ])],
  controllers: [RolesController],
  providers: [RolesService, PaginationService, RoleRelationshipService],
  exports: [RolesService, MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }])]
})
export class RolesModule { }
