import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Permission, PermissionDocument } from './schema/permission.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { PaginationService } from '../_shared/paginate/pagination.service';
import mongoose from 'mongoose';
import { IUser } from '../users/user.interface';
import { PermissionRelationshipService } from './permission-relationship.service';

@Injectable()
export class PermissionsService {

  constructor(@InjectModel(Permission.name)
  private permissionModel: SoftDeleteModel<PermissionDocument>,
    private relationService: PermissionRelationshipService,
    private paginationService: PaginationService) { }

  async create(createPermissionDto: CreatePermissionDto, user: IUser) {
    const { apiPath, method } = createPermissionDto;
    const permissionExist = await this.permissionModel.findOne({ apiPath, method });
    if (permissionExist) throw new BadRequestException(`permission apiPath=${apiPath} method=${method} already exists`);

    await this.permissionModel.create({ ...createPermissionDto, createdBy: user._id });
    return "Create permission successfully";
  }

  async findAll(currentPage: number, limit: number, qs: string) {
    const permissions = await this.permissionModel.find();
    return this.paginationService.getPagination(permissions, currentPage, limit, qs);
  }

  async findOne(id: string) {
    const permission = await this.permissionExist(id);
    return permission;
  }

  async update(updatePermissionDto: UpdatePermissionDto, user: IUser) {
    await this.permissionExist(updatePermissionDto._id);
    const updatedPermission = await this.permissionModel.updateOne(
      { _id: updatePermissionDto._id },
      { ...updatePermissionDto, updatedBy: user._id },
      { new: true }
    )
    return "Update permission successfully";
  }

  async remove(id: string, user: IUser) {
    const isRelation = await this.relationService.checkPermissionRelations(id);
    if (isRelation)
      throw new BadRequestException("Can't remove permission because it's linked to role");
    await this.permissionExist(id);
    await this.permissionModel.updateOne(
      { _id: id },
      { deletedBy: user._id }
    )
    await this.permissionModel.softDelete({ _id: id });
    return "Delete permission successfully";
  }

  async permissionExist(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid id mongooo');
    }
    const department = await this.permissionModel.findOne({
      _id: id,
      $or: [
        { isDeleted: { $exists: false } },
        { isDeleted: false },
      ],
    });
    if (!department) throw new BadRequestException('Not found permission');
    return department;
  }

  async isIdPermissionExist(id: string) {
    const permission = await this.permissionModel.findOne({ _id: id });
    if (permission) return true;

    return false;
  }
}
