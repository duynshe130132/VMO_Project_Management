import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateProjecttypeDto } from './dto/create-projecttype.dto';
import { UpdateProjecttypeDto } from './dto/update-projecttype.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Projecttype, ProjecttypeDocument } from './schema/projecttype.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { PaginationService } from '../_shared/paginate/pagination.service';
import mongoose from 'mongoose';
import { IUser } from '../users/user.interface';
import { TypeRelationshipService } from './type-relationship.service';

@Injectable()
export class ProjecttypesService {

  constructor(@InjectModel(Projecttype.name)
  private projectTypeModel: SoftDeleteModel<ProjecttypeDocument>,
    private relationService: TypeRelationshipService,
    private paginationService: PaginationService) { }

  async create(createProjecttypeDto: CreateProjecttypeDto, user: IUser) {
    const isExistName = await this.projectTypeModel.findOne({ name: createProjecttypeDto.name });
    if (isExistName) {
      throw new BadRequestException("Project type is already exist!");
    }
    await this.projectTypeModel.create({ ...createProjecttypeDto, createdBy: user._id });
    return "Create project type successfully";
  }

  async findAll(currentPage: number, limit: number, qs: string) {
    const types = await this.projectTypeModel.find();
    return await this.paginationService.getPagination(types, currentPage, limit, qs);
  }

  async findOne(id: string) {
    try {
      const projectType = await this.projectTypeExist(id);
      return projectType;
    }
    catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  async update(updateProjecttypeDto: UpdateProjecttypeDto, user: IUser) {
    await this.projectTypeExist(updateProjecttypeDto._id.toString());

    await this.projectTypeModel.updateOne({ _id: updateProjecttypeDto._id }, { ...updateProjecttypeDto, updatedBy: user._id });
    return "Update project type successfully";
  }

  async remove(id: string, user: IUser) {
    const isRelation = await this.relationService.checkProjectRelations(id);
    if (isRelation)
      throw new BadRequestException("Can't remove type because it's linked to project")
    await this.projectTypeExist(id);
    await this.projectTypeModel.updateOne({ _id: id }, { deletedBy: user._id });
    const removeType = await this.projectTypeModel.softDelete({ _id: id });
    return 'Remove project type successfully';
  }

  async projectTypeExist(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid id mongo');
    }
    const type = await this.projectTypeModel.findOne({
      _id: id,
      $or: [
        { isDeleted: { $exists: false } },
        { isDeleted: false },
      ],
    });
    if (!type) throw new BadRequestException('Not found project type');
    return type;
  }

  async isIdProjectTypeExist(id: string) {
    const projecttype = await this.projectTypeModel.findOne({ _id: id });
    if (projecttype) return true;

    return false;
  }
}
