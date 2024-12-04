import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { Permission, PermissionSchema } from './schema/permission.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { PaginationService } from '../_shared/paginate/pagination.service';
import { PermissionRelationshipService } from './permission-relationship.service';
import { Role, RoleSchema } from '../roles/schema/role.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Permission.name, schema: PermissionSchema },
  { name: Role.name, schema: RoleSchema }
  ])],
  controllers: [PermissionsController],
  providers: [PermissionsService, PaginationService, PermissionRelationshipService],
})
export class PermissionsModule { }
