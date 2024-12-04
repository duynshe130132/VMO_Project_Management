import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateStatusDto } from './dto/create-status.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { IUser } from '../users/user.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Status, StatusDocument } from './schema/status.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { PaginationService } from '../_shared/paginate/pagination.service';
import mongoose from 'mongoose';
import { StatusRelationshipService } from './status-relationship.service';

@Injectable()
export class StatusService {

  constructor(@InjectModel(Status.name)
  private statusModel: SoftDeleteModel<StatusDocument>,
    private relationService: StatusRelationshipService,
    private paginationService: PaginationService) { }

  async create(createStatusDto: CreateStatusDto, user: IUser) {
    const { name } = createStatusDto;
    const nameExisting = await this.statusModel.findOne({ name });
    if (nameExisting) throw new BadRequestException('Status already exists');

    await this.statusModel.create({ ...createStatusDto, createdBy: user._id });
    return "Create new status successfully";
  }


  async findAll(currentPage: number, limit: number, qs: string) {
    const status = await this.statusModel.find();
    return await this.paginationService.getPagination(status, currentPage, limit, qs);
  }

  async findOne(id: string) {
    try {
      const status = await this.statusExist(id);
      return status;
    } catch (error) {
      throw error; // Chuyển tiếp lỗi ném ra từ statusExist
    }
  }

  async update(updateStatusDto: UpdateStatusDto, user: IUser) {
    const { _id, name } = updateStatusDto;
    await this.statusExist(_id.toString());

    await this.statusModel
      .updateOne({ _id: updateStatusDto._id }
        , { ...updateStatusDto, updatedBy: user._id }
        , { new: true });
    return "Update status successfully";
  }

  async remove(id: string, user: IUser) {
    const isRelation = await this.relationService.checkStatusRelations(id);
    if (isRelation)
      throw new BadRequestException("Can't remove status because it's linked to project");
    await this.statusExist(id);
    await this.statusModel.updateOne({ _id: id }, { deletedBy: user._id });
    const removeStatus = await this.statusModel.softDelete({ _id: id });
    return "Delete status successfully";
  }

  async statusExist(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid id mongo');
    }

    const status = await this.statusModel.findOne({
      _id: id,
      $or: [
        { isDeleted: { $exists: false } },
        { isDeleted: false },
      ],
    });
    if (!status) throw new BadRequestException('Not found status');
    return status;
  }

  async isIdStatusExist(id: string) {
    const status = await this.statusModel.findOne({ _id: id });
    if (status) return true;

    return false;
  }
}
