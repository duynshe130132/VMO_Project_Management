import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Role, RoleDocument } from './schema/role.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { PaginationService } from '../_shared/paginate/pagination.service';
import mongoose from 'mongoose';
import { IUser } from '../users/user.interface';
import { RoleRelationshipService } from './role-relationship.service';

@Injectable()
export class RolesService {

  constructor(@InjectModel(Role.name)
  private roleModel: SoftDeleteModel<RoleDocument>,
    private relationService: RoleRelationshipService,
    private paginationService: PaginationService) { }

  async create(createRoleDto: CreateRoleDto, user: IUser) {
    const { name } = createRoleDto;
    const nameExist = await this.roleModel.findOne({ name });
    if (nameExist) throw new BadRequestException('Role already exists');

    await this.roleModel.create({ ...createRoleDto, createdBy: user._id });
    return "Create role successfully";
  }

  async findAll(currentPage: number, limit: number, qs: string) {
    const roles = await this.roleModel.find();
    return await this.paginationService.getPagination(roles, currentPage, limit, qs);
  }

  async findOne(id: string) {
    const role = await this.roleExist(id);
    return role;
  }

  async update(updateRoleDto: UpdateRoleDto, user: IUser) {
    await this.roleExist(updateRoleDto._id.toString());
    await this.roleModel.updateOne({ _id: updateRoleDto._id }, { ...updateRoleDto, updatedBy: user._id });
    return "Update role successfully";
  }

  async remove(id: string, user: IUser) {
    const isRelation = await this.relationService.checkRoleRelations(id);
    if (isRelation)
      throw new BadRequestException("Can't remove role because it's linked to user");
    await this.roleExist(id);
    await this.roleModel.softDelete({ _id: id });
    return "Remove role successfully";
  }

  async roleExist(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid id mongo');
    }

    const role = await this.roleModel.findOne({
      _id: id,
      $or: [
        { isDeleted: { $exists: false } },
        { isDeleted: false },
      ],
    }).populate({ path: 'permissionId', select: '_id apiPath name method module' });
    if (!role) throw new BadRequestException('Not found role');
    return role;
  }

  async isIdRoleExist(id: string) {
    const role = await this.roleModel.findOne({ _id: id });
    if (role) return true;

    return false;
  }
}
