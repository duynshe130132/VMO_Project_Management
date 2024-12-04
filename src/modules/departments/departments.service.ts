import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Department, DepartmentDocument } from './schema/department.schema';
import { InjectModel } from '@nestjs/mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { PaginationService } from '../_shared/paginate/pagination.service';
import { IUser } from '../users/user.interface';
import mongoose, { Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { DepartmentRelationshipService } from './department-relationship.service';

@Injectable()
export class DepartmentsService {

  constructor(
    @InjectModel(Department.name) private departmentModel: SoftDeleteModel<DepartmentDocument>,
    @Inject(forwardRef(() => UsersService)) private userService: UsersService,
    private paginationService: PaginationService,
    private relationShipService: DepartmentRelationshipService) { }

  async create(createDepartmentDto: CreateDepartmentDto, user: IUser) {
    try {
      const { user_managerId } = createDepartmentDto;
      const name = await this.departmentModel.findOne({ name: createDepartmentDto.name });
      if (name) throw new BadRequestException("Department already exists");
      await this.checkManagerId(user_managerId.toString());
      const countExist = await this.checkExistMngInD(createDepartmentDto.user_managerId.toString());
      if (countExist > 0) {
        throw new BadRequestException("Manager already exist in another department");
      }
      const newDepartment = await this.departmentModel.create({
        ...createDepartmentDto,
        createdBy: user._id,
      });
      await this.userService.updateDepartmentId(newDepartment.user_managerId.toString(), newDepartment._id.toString());
      return newDepartment;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async listAllDepartment(user: IUser, currentPage: number, limit: number, qs: string) {
    try {
      const role = user.roleName;
      const userId = user._id;
      let results;
      switch (role) {
        case 'Admin':
          results = await this.findAll();
          break;
        case 'Manager':
          results = await this.findManagerDepartment(userId);
          break;
        case 'Employee':
          results = await this.findAllUserDepartment(userId);
          break;
        default:
          throw new UnauthorizedException('Invalid role');
      }
      return this.paginationService.getPagination(results, currentPage, limit, qs);
    }
    catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getById(departmentId: string, user: IUser) {
    try {
      const role = user.roleName;
      let result;
      switch (role) {
        case 'Admin':
          result = await this.findOne(departmentId);
          break;
        case 'Manager':
          result = await this.findManagerDepartmentById(departmentId, user);
          break;
        case 'Employee':
          result = await this.findUserDepartmentById(departmentId, user);
          break;
        default:
          throw new UnauthorizedException('Invalid role');
      }
      return result;
    }
    catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(updateDepartmentDto: UpdateDepartmentDto, user: IUser) {
    try {
      const department = await this.DepartmentExist(updateDepartmentDto._id.toString());
      await this.checkManagerId(updateDepartmentDto.user_managerId.toString())
      // const objectDepartment = await this.findOne(updateDepartmentDto._id.toString());
      if (department.user_managerId.toString() !== updateDepartmentDto.user_managerId.toString()) {
        const countExist = await this.checkExistMngInD(updateDepartmentDto.user_managerId.toString());
        if (countExist >= 1) throw new BadRequestException('Manager already exists in another department');
      }
      await this.departmentModel.updateOne({ _id: updateDepartmentDto._id }, { ...updateDepartmentDto, updatedBy: user._id });
      if (department.user_managerId.toString() !== updateDepartmentDto.user_managerId.toString()) {
        await this.userService.updateDepartmentId(updateDepartmentDto.user_managerId.toString(), updateDepartmentDto._id.toString());
      }
      return { message: "Update department successfully" };
    }
    catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async remove(id: string, user: IUser) {
    try {
      const relation = await this.relationShipService.checkDepartmentRelations(id)
      console.log(relation)
      if (relation)
        throw new BadRequestException("Can't remove department because it's linked to user");
      await this.DepartmentExist(id);
      await this.departmentModel.updateOne({ _id: id }, { deletedBy: user._id });
      await this.departmentModel.softDelete({ _id: id });
      return { message: "Remove department successfully" };
    }
    catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////

  async checkManagerId(userId: string) {
    const findUser = await this.userService.findOne(userId.toString());
    const roleUser = findUser.roleId.name;
    if (roleUser !== "Manager") throw new BadRequestException("not manager");
  }
  async checkExistMngInD(userId: string) {
    let countExist = 0;
    const isExistManagerId = await this.departmentModel.find({ user_managerId: userId });
    countExist = isExistManagerId.length;
    return countExist;
  }

  async isManagerDepartment(userId: string, departmentId: string): Promise<boolean> {
    let isDep = false;
    const department = await this.departmentModel.findOne({ _id: departmentId, user_managerId: userId });
    if (department) isDep = true;
    return isDep;
  }

  async DepartmentExist(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid id mongooo');
    }
    const department = await this.departmentModel.findOne({
      _id: id,
      $or: [
        { isDeleted: { $exists: false } },
        { isDeleted: false },
      ],
    });
    if (!department) throw new BadRequestException('Not found department');
    return department;
  }
  async findAll() {
    const departments = await this.departmentModel.find();
    return departments;
  }

  async findUserDepartmentById(id: string, user: IUser) {
    try {
      const users = await this.userService.findUserByDepId(id);
      const userId = user._id;
      let isUserIdInList = false;

      users.forEach(u => {
        if (u._id.toString() === userId.toString()) isUserIdInList = true;
      })
      if (!isUserIdInList) throw new BadRequestException('User not found in department');
      const department = await this.DepartmentExist(id);
      // const department = await this.departmentModel.findOne({ _id: id });
      if (!department) throw new BadRequestException(`Not found department`);
      return department;
    }
    catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findManagerDepartmentById(departmentId: string, user: IUser) {
    try {
      const departments = await this.findManagerDepartment(user._id.toString());
      const idExist = departments.some((department) => department._id.toString() === departmentId);
      if (!idExist) throw new BadRequestException('Not found department');
      const department = await this.departmentModel.findOne({ _id: departmentId });
      return department;
    }
    catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOne(id: string) {
    const department = await this.DepartmentExist(id);
    return department;
  }


  async findManagerDepartment(userId: string) {
    const departments = await this.departmentModel.find({ user_managerId: userId });
    if (!departments) throw new BadRequestException('Not found department');
    return departments;
  }

  async findAllUserDepartment(userId: string) {
    const departmentIds = await this.userService.findAllDepByUserId(userId);
    if (!departmentIds) throw new BadRequestException('Not found department');
    const departments = await this.departmentModel.find({ _id: { $in: departmentIds } });
    return departments;
  }
  async findByProjectId(projectId: string) {
    const departments = await this.departmentModel.find();
    const department = departments.filter((department) => department.projectId.some((id) => id.toString() === projectId));

    return department;
  }

  async isIdDepartmentExist(id: string) {
    const department = await this.departmentModel.findOne({ _id: id });
    if (department) return true;

    return false;
  }
}
