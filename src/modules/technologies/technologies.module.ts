import { Module } from '@nestjs/common';
import { TechnologiesService } from './technologies.service';
import { TechnologiesController } from './technologies.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Technology, TechnologySchema } from './schema/technology.schema';
import { PaginationService } from '../_shared/paginate/pagination.service';
import { TechnologyRelationshipService } from './technology-relationship.service';
import { Project, ProjectSchema } from '../projects/schema/project.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Technology.name, schema: TechnologySchema },
  { name: Project.name, schema: ProjectSchema }
  ])],
  controllers: [TechnologiesController],
  providers: [TechnologiesService, PaginationService, TechnologyRelationshipService],
  exports: [TechnologiesService]
})
export class TechnologiesModule { }
