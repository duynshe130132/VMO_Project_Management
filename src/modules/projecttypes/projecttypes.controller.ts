import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ProjecttypesService } from './projecttypes.service';
import { CreateProjecttypeDto } from './dto/create-projecttype.dto';
import { UpdateProjecttypeDto } from './dto/update-projecttype.dto';
import { ResponseMessage } from 'src/decorator/response-message.decorator';
import { PaginatedQuery } from 'src/decorator/query-params.decorator';
import { IUser } from '../users/user.interface';
import { User } from 'src/decorator/user.decorator';

@Controller('projecttypes')
export class ProjecttypesController {
  constructor(private readonly projectTypesService: ProjecttypesService) { }

  @ResponseMessage("Create project type")
  @Post()
  create(@Body() createProjecttypeDto: CreateProjecttypeDto, @User() user: IUser) {
    return this.projectTypesService.create(createProjecttypeDto, user);
  }


  @ResponseMessage("Get all project type")
  @PaginatedQuery()
  @Get()
  findAll(@Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('qs') qs: string) {
    return this.projectTypesService.findAll(page, limit, qs)
  }

  @ResponseMessage("Get project type by id")
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectTypesService.findOne(id);
  }

  @ResponseMessage("Update project type")
  @Patch()
  update(@Body() updateProjecttypeDto: UpdateProjecttypeDto, @User() user: IUser) {
    return this.projectTypesService.update(updateProjecttypeDto, user);
  }

  @ResponseMessage("Delete project type")
  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.projectTypesService.remove(id, user);
  }
}
