import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateTechnologyDto } from './dto/create-technology.dto';
import { UpdateTechnologyDto } from './dto/update-technology.dto';
import { IUser } from '../users/user.interface';
import { Technology, TechnologyDocument } from './schema/technology.schema';
import { InjectModel } from '@nestjs/mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { PaginationService } from '../_shared/paginate/pagination.service';
import mongoose, { mongo } from 'mongoose';
import { UpdateProjecttypeDto } from '../projecttypes/dto/update-projecttype.dto';
import { TechnologyRelationshipService } from './technology-relationship.service';

@Injectable()
export class TechnologiesService {

  constructor(@InjectModel(Technology.name)
  private technologyModel: SoftDeleteModel<TechnologyDocument>,
    private relationService: TechnologyRelationshipService,
    private paginationService: PaginationService) { }

  async create(createTechnologyDto: CreateTechnologyDto, user: IUser) {
    const nameExisting = await this.technologyModel.findOne({ name: createTechnologyDto.name });
    if (nameExisting) throw new BadRequestException('name already exists');

    await this.technologyModel.create({ ...createTechnologyDto, createdBy: user._id })
    return "Create technology successfully";
  }

  async findAll(currentPage: number, limit: number, qs: string) {
    const technologies = await this.technologyModel.find();
    return await this.paginationService.getPagination(technologies, currentPage, limit, qs)
  }

  async findOne(id: string) {
    const technology = await this.technologyExist(id);
    return technology;
  }

  async update(updateTechnologyDto: UpdateTechnologyDto, user: IUser) {
    await this.technologyExist(updateTechnologyDto._id);
    await this.technologyModel
      .updateOne({ _id: updateTechnologyDto._id },
        { ...updateTechnologyDto, updatedBy: user._id },
        { new: true });
    return "Update Technology Successfully";
  }

  async remove(id: string, user: IUser) {
    const isRelation = await this.relationService.checkTechnologyRelations(id);
    if (isRelation)
      throw new BadRequestException("Can't remove a technology because it's linked to project");
    await this.technologyExist(id);
    await this.technologyModel.updateOne({ _id: id }, { deletedBy: user._id });
    await this.technologyModel.softDelete({ _id: id });
    return "Remove Technology successfully";
  }


  async technologyExist(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid id mongooo');
    }
    const technology = await this.technologyModel.findOne({
      _id: id,
      $or: [
        { isDeleted: { $exists: false } },
        { isDeleted: false },
      ],
    });
    if (!technology) throw new BadRequestException('Not found technology');
    return technology;
  }

  async isIdTechnologyExist(id: string) {
    const technology = await this.technologyModel.findOne({ _id: id });
    if (technology) return true;

    return false;
  }
}
