import { Module } from '@nestjs/common';
import { ProjecttypesService } from './projecttypes.service';
import { ProjecttypesController } from './projecttypes.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Projecttype, ProjecttypeSchema } from './schema/projecttype.schema';
import { PaginationService } from '../_shared/paginate/pagination.service';
import { Project, ProjectSchema } from '../projects/schema/project.schema';
import { TypeRelationshipService } from './type-relationship.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Projecttype.name, schema: ProjecttypeSchema },
  { name: Project.name, schema: ProjectSchema }
  ])],
  controllers: [ProjecttypesController],
  providers: [ProjecttypesService, PaginationService, TypeRelationshipService],
  exports: [ProjecttypesService]
})
export class ProjecttypesModule { }
