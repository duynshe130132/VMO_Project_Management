import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Project, ProjectDocument } from './schema/project.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { PaginationService } from '../_shared/paginate/pagination.service';
import mongoose, { Types } from 'mongoose';
import { IUser } from '../users/user.interface';
import { DepartmentsService } from '../departments/departments.service';
import { UsersService } from '../users/users.service';
import { ProjectRelationshipService } from './project-relationship.service';
import { ProjecttypesService } from '../projecttypes/projecttypes.service';
import { StatusService } from '../status/status.service';
import { TechnologiesService } from '../technologies/technologies.service';
import { CustomersService } from '../customers/customers.service';
import { UpdateDepartmentDto } from '../departments/dto/update-department.dto';

@Injectable()
export class ProjectsService {

  constructor(@InjectModel(Project.name)
  private projectModel: SoftDeleteModel<ProjectDocument>,
    private departmentService: DepartmentsService,
    @Inject(forwardRef(() => UsersService)) private userService: UsersService,
    private typeService: ProjecttypesService,
    private statusService: StatusService,
    private technologyService: TechnologiesService,
    private customersService: CustomersService,
    private relationSerivce: ProjectRelationshipService,
    private paginationService: PaginationService) { }

  async create(createProjectDto: CreateProjectDto, user: IUser) {
    try {
      const name = await this.projectModel.findOne({ name: createProjectDto.name });
      if (name) throw new BadRequestException('Project already exists');
      if (createProjectDto.userId && createProjectDto.userId.length !== 0)
        throw new BadRequestException("You can only add users to this project after adding the project to the department")
      if (createProjectDto.statusId.toString() === "6732f6d2e8d78e9f0cc1af6a") {
        throw new BadRequestException("Cannot create a project with 'Cancelled' status");
      }
      const newProject = await this.projectModel.create({
        ...createProjectDto,
        createdBy: user._id,
      });
      return newProject;
    }
    catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async listAll(user: IUser, currentPage: number, limit: number, qs: string) {
    try {
      const role = user.roleName;
      let results;
      switch (role) {
        case 'Admin':
          results = await this.findAll();
          break;
        case 'Manager':
          results = await this.findAllManagerProject(user);
          break;
        case 'Employee':
          results = await this.listAllEmployeeProject(user);
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

  async findAll() {
    const projects = await this.projectModel.find();
    return projects;
  }

  async getById(id: string, user: IUser) {
    try {
      const role = user.roleName;
      let result;
      switch (role) {
        case 'Admin':
          result = await this.findOne(id);
          break;
        case 'Manager':
          result = await this.findDProject(id, user);
          break;
        case 'Employee':
          result = await this.findEmpProjectById(id, user);
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

  async listAllInDepartment(idDepartment: string, user: IUser, currentPage: number, limit: number, qs: string) {
    try {
      const role = user.roleName;
      let results;
      switch (role) {
        case 'Admin':
          results = await this.findAllInDepartment(idDepartment);
          break;
        case 'Manager':
          results = await this.findManagerProjectByDepId(user, idDepartment);
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


  async getByUserId(userId: string, user: IUser, currentPage: number, limit: number, qs: string) {
    try {
      const role = user.roleName;
      let results;
      switch (role) {
        case 'Admin':
          results = await this.findProjectByEmpId(userId);
          break;
        case 'Manager':
          results = await this.findProjectByEmployeeId(user, userId);
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


  async update(updateProjectDto: UpdateProjectDto, user: IUser) {
    try {

      await this.projectExist(updateProjectDto._id);
      const isExistInDepartment = await this.projectExistInDepartment(updateProjectDto._id.toString());
      if (!isExistInDepartment && Array.isArray(updateProjectDto.userId) && updateProjectDto.userId !== null) {
        throw new BadRequestException("You can only add users to this project after adding the project to the department");
      }
      if (isExistInDepartment && updateProjectDto.userId !== null) {
        const departments = await this.departmentService.findByProjectId(updateProjectDto._id);
        const departmentsId = departments.map(department => department._id);

        const usersId = updateProjectDto.userId;
        const users = await this.userService.findAllUser();
        const usersByDepartment = [];
        departmentsId.forEach(id => {
          const matchingUsers = users.filter((user) => user.departmentId.toString() === id.toString())

          if (matchingUsers.length > 0) {
            usersByDepartment.push(...matchingUsers);
          }
        })
        const isValid = usersId.every(userId => usersByDepartment.some(user => user._id.toString() === userId.toString()));
        if (!isValid) throw new BadRequestException('User must belong to a department that contains the project')

        const usersInput = users.filter(user => usersId.toString().includes(user._id.toString()));
        const invalidTechnologyUsers = usersInput.filter(user => {
          return (Array.isArray(user.technologyId) && user.technologyId.length === 0); // Kiểm tra nếu là mảng trống
        });
        if (invalidTechnologyUsers.length > 0) {
          throw new BadRequestException('User must have a technology assigned');
        }
      }
      await this.projectModel.updateOne(
        { _id: updateProjectDto._id },
        { ...updateProjectDto, updatedBy: user._id },
        { new: true }
      )

      return { message: 'update project successfully' };
    }
    catch (error) {
      throw new BadRequestException(error.message);
    }
  }


  async remove(id: string, user: IUser) {
    try {
      const isRelationExist = await this.relationSerivce.checkProjectRelations(id)
      if (isRelationExist)
        throw new BadRequestException("Can't remove project because it's linked to department");
      await this.projectExist(id);
      await this.projectModel.updateOne(
        { _id: id },
        { deletedBy: user._id }
      )
      await this.projectModel.softDelete({ _id: id });
      return { message: `Delete project successfully` };
    }
    catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////////

  async projectExist(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid id mongooo');
    }
    const project = await this.projectModel.findOne({
      _id: id,
      $or: [
        { isDeleted: { $exists: false } },
        { isDeleted: false },
      ],
    });
    if (!project) throw new BadRequestException('Not found project');
    return project;
  }

  async projectExistInDepartment(projectId: string) {
    const isExistProject = await this.departmentService.findByProjectId(projectId);
    if (isExistProject.length > 0) return true;
    return false;
  }

  async isManagerProject(projectId: string, userId: string) {
    const departments = await this.departmentService.findManagerDepartment(userId);
    const isExist = departments.some(department =>
      department.projectId.some(id => id.toString() === projectId)
    );
    return isExist;
  }

  async findAllManagerProject(user: IUser) {
    const departments = await this.departmentService.findManagerDepartment(user._id);
    const projectIds = departments.map(department => department.projectId).flat();

    const projects = await Promise.all(
      projectIds.map(projectId => this.projectModel.findOne({ _id: projectId }))
    )
    return projects;
  }

  async listAllEmployeeProject(user: IUser) {
    const projects = await this.findAllEmpProject(user);
    return projects;
  }
  async findAllEmpProject(user: IUser) {
    const projects = await this.projectModel.find();
    const userProjects = projects.filter((project) => project.userId.some(id => id.toString() === user._id.toString()));
    return userProjects;
  }

  async findOne(id: string) {
    const project = await this.projectExist(id);
    return project;
  }
  async findDProject(projectId: string, user: IUser) {
    const departments = await this.departmentService.findManagerDepartment(user._id);
    const isProjectFound = departments.some(d =>
      d.projectId.some(id => id.toString() === projectId)
    );
    if (!isProjectFound) throw new BadRequestException('not found project in department');
    const project = await this.projectModel.findOne({ _id: projectId });
    return project;
  }

  async findEmpProjectById(projectId: string, user: IUser) {
    //check thuộc phòng ban
    const departmentIds = await this.userService.findAllDepByUserId(user._id);
    const departments = await Promise.all(departmentIds.map(id => this.departmentService.findOne(id.toString())));
    const isExistInDepartment = departments.some((department) => department.projectId.some(id => id.toString() === projectId));
    if (!isExistInDepartment) throw new BadRequestException('Could not find project in your department');

    //check thuộc user
    const projects = await this.findAllEmpProject(user);
    const isProjectFound = await projects.some(project => project._id.toString() === projectId);
    if (!isProjectFound) throw new BadRequestException('Not found project');

    const project = await this.findOne(projectId);
    return project;
  }

  async findUserByProjectId(projectId: string) {

    const project = await this.findOne(projectId);
    const usersId = project.userId;
    return usersId;
  }

  async findAllInDepartment(idDepartment: string) {
    const department = await this.departmentService.findOne(idDepartment);
    if (!department) throw new BadRequestException('department id is invalid!');
    const projectsId = department.projectId;
    const projects = await this.projectModel.find({ _id: { $in: projectsId } });
    return projects;
  }

  async findManagerProjectByDepId(user: IUser, depId: string) {
    const departments = await this.departmentService.findManagerDepartment(user._id);
    const department = departments.find(department =>
      department._id.toString() === depId
    );
    if (!department)
      throw new BadRequestException('department id is invalid');
    const projectIds = department.projectId;
    const projects = await Promise.all(
      projectIds.map(projectId => this.projectModel.findOne({ _id: projectId }))
    );
    return projects;
  }

  async findProjectByEmpId(userId: string) {
    const projects = await this.projectModel.find();
    const userProjects = projects.filter((project) => project.userId.some(id => id.toString() === userId));
    if (userProjects.length === 0)
      throw new BadRequestException('Not found projects');
    return userProjects;
  }

  async findProjectByEmployeeId(user: IUser, employeeId: string) {
    const departments = await this.departmentService.findManagerDepartment(user._id);
    const departmentsId = departments.map(department => department._id).flat();
    const employee = await this.userService.findOne(employeeId);
    const empDepIds = employee.departmentId;

    let existDepartment = false;
    empDepIds.forEach(depId => {
      const isExistInDepartment = departmentsId.some(departmentId => departmentId.toString() === depId.toString());
      if (isExistInDepartment) existDepartment = true;
    })
    if (!existDepartment) throw new BadRequestException('This employee does not exist in your department')

    const projects = await this.projectModel.find();

    const userProjects = projects.filter((project) => project.userId.some(id => id.toString() === employeeId));

    return userProjects;
  }

  async isIdProjectExist(id: string) {
    const project = await this.projectModel.findOne({ _id: id });
    if (project) return true;

    return false;
  }


  excel_getAll(query: any) {
    return this.projectModel.find(query).populate('statusId', 'name')
      .populate('technologyId', 'name')
      .populate('projectTypeId', 'name')
      .populate('userId', 'name')
      .populate('createdBy', 'email').exec();
  }


  async findAllByAdminFilters(
    filters: { startDate?: Date; endDate?: Date; projectTypeId?: string; statusId?: string, technologyId?: string, customerId?: string }
  ): Promise<any[]> {
    const { startDate, endDate, projectTypeId, statusId, technologyId, customerId } = filters;

    let query: any = {};

    if (startDate || endDate) {
      query.startDate = {};
      query.endDate = {};
      if (startDate) {
        query.startDate.$gte = new Date(startDate); // >= startDate
      }
      if (endDate) {
        query.endDate.$lte = new Date(endDate); // <= endDate
      }
    }

    if (projectTypeId) {
      const type = await this.typeService.findOne(projectTypeId);
      if (!type)
        throw new BadRequestException("type not found");
      query.projectTypeId = projectTypeId;
    }
    if (statusId) {
      const status = await this.statusService.findOne(statusId);
      if (!status)
        throw new BadRequestException("status not found");
      query.statusId = statusId;
    }
    if (technologyId) {
      const technology = await this.technologyService.findOne(technologyId);
      if (!technology)
        throw new BadRequestException("technology not found");
      query.technologyId = technologyId;
    }
    if (customerId) {
      const customer = await this.customersService.findOne(customerId);
      if (!customer)
        throw new BadRequestException("customer not found");
      query.customerId = customerId;
    }


    const projects = await this.excel_getAll(query)
    return projects;

  }


  async findAllByManagerFilters(user: IUser,
    filters: { startDate?: Date; endDate?: Date; projectTypeId?: string; statusId?: string, technologyId?: string, customerId?: string }
  ): Promise<any[]> {
    const { startDate, endDate, projectTypeId, statusId, technologyId, customerId } = filters;

    const departments = await this.departmentService.findManagerDepartment(user._id);
    const projectIds = departments.map(department => department.projectId).flat();
    const projectQuery: any = { _id: { $in: projectIds } };  // Lọc theo projectIds

    let query: any = {};

    if (startDate || endDate) {
      query.startDate = {};
      query.endDate = {};
      if (startDate) {
        query.startDate.$gte = new Date(startDate); // >= startDate
      }
      if (endDate) {
        query.endDate.$lte = new Date(endDate); // <= endDate
      }
    }

    if (projectTypeId) {
      const type = await this.typeService.findOne(projectTypeId);
      if (!type)
        throw new BadRequestException("type not found");
      query.projectTypeId = projectTypeId;
    }
    if (statusId) {
      const status = await this.statusService.findOne(statusId);
      if (!status)
        throw new BadRequestException("status not found");
      query.statusId = statusId;
    }
    if (technologyId) {
      const technology = await this.technologyService.findOne(technologyId);
      if (!technology)
        throw new BadRequestException("technology not found");
      query.technologyId = technologyId;
    }
    if (customerId) {
      const customer = await this.customersService.findOne(customerId);
      if (!customer)
        throw new BadRequestException("customer not found");
      query.customerId = customerId;
    }


    const projects = await this.excel_getAll(projectQuery)
    return projects;

  }
}
