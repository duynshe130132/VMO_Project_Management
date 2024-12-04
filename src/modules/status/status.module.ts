import { Module } from '@nestjs/common';
import { StatusService } from './status.service';
import { StatusController } from './status.controller';
import { Status, StatusSchema } from './schema/status.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { PaginationService } from '../_shared/paginate/pagination.service';
import { Project, ProjectSchema } from '../projects/schema/project.schema';
import { StatusRelationshipService } from './status-relationship.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Status.name, schema: StatusSchema },
  { name: Project.name, schema: ProjectSchema }
  ])],
  controllers: [StatusController],
  providers: [StatusService, PaginationService, StatusRelationshipService],
  exports: [MongooseModule.forFeature([{ name: Status.name, schema: StatusSchema }]), StatusService]
})
export class StatusModule { }
