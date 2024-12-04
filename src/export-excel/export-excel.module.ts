import { Module } from '@nestjs/common';
import { ExportExcelService } from './export-excel.service';
import { ExportExcelController } from './export-excel.controller';
import { UsersModule } from 'src/modules/users/users.Module';
import { DepartmentsModule } from 'src/modules/departments/departments.Module';
import { ProjectsModule } from 'src/modules/projects/projects.module';

@Module({
  imports: [UsersModule, DepartmentsModule, ProjectsModule],
  providers: [ExportExcelService],
  controllers: [ExportExcelController]
})
export class ExportExcelModule { }
