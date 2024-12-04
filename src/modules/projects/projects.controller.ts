import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ResponseMessage } from 'src/decorator/response-message.decorator';
import { User } from 'src/decorator/user.decorator';
import { IUser } from '../users/user.interface';
import { PaginatedQuery } from 'src/decorator/query-params.decorator';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) { }

  //admin (OKE)
  @ResponseMessage("Create new project")
  @Post()
  create(@Body() createProjectDto: CreateProjectDto, @User() user: IUser) {
    return this.projectsService.create(createProjectDto, user);
  }

  //All
  @ResponseMessage("Get all projects")
  @Get()
  @PaginatedQuery()
  findAll(@Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('qs') qs: string,
    @User() user: IUser) {
    return this.projectsService.listAll(user, page, limit, qs);
  }

  //All
  @ResponseMessage("get project by id")
  @Get(':id')
  findOne(@Param('id') id: string,
    @User() user: IUser) {
    return this.projectsService.getById(id, user);
  }


  // Admin + Manager (OKE)
  @ResponseMessage("Get all projects by departmentId (Admin)")
  @Get('/department/:id')
  @PaginatedQuery()
  findAllProjectInDep(@Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('qs') qs: string,
    @Param('id') id: string,
    @User() user: IUser) {
    return this.projectsService.listAllInDepartment(id, user, page, limit, qs);
  }

  //Admin + Manager (OKE)
  @ResponseMessage("get all project by userId")
  @Get('/user/:id')
  @PaginatedQuery()
  getProjectByEmpId(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('qs') qs: string,
    @User() user: IUser) {
    return this.projectsService.getByUserId(id, user, page, limit, qs);
  }

  //admin
  @ResponseMessage("Update project")
  @Patch()
  update(@Body() updateProjectDto: UpdateProjectDto, @User() user: IUser) {
    return this.projectsService.update(updateProjectDto, user);
  }
  //admin
  @ResponseMessage("Delete project")
  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.projectsService.remove(id, user);
  }
}
