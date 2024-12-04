import { BadRequestException, Injectable } from "@nestjs/common";
import { CustomersService } from "src/modules/customers/customers.service";
import { DepartmentsService } from "src/modules/departments/departments.service";
import { PermissionsService } from "src/modules/permissions/permissions.service";
import { ProjectsService } from "src/modules/projects/projects.service";
import { ProjecttypesService } from "src/modules/projecttypes/projecttypes.service";
import { RolesService } from "src/modules/roles/roles.service";
import { StatusService } from "src/modules/status/status.service";
import { TechnologiesService } from "src/modules/technologies/technologies.service";
import { UsersService } from "src/modules/users/users.service";

@Injectable()
export class CheckExistenceService {
    constructor(
        private readonly userService: UsersService,  // Inject UserService
        private readonly departmentService: DepartmentsService,
        private readonly technologyService: TechnologiesService,
        private readonly roleService: RolesService,
        private readonly customerService: CustomersService,  // Inject UserService
        private readonly permissionService: PermissionsService,
        private readonly projectService: ProjectsService,
        private readonly projectTypeService: ProjecttypesService,
        private readonly statusService: StatusService
    ) { }

    private async checkUserExistence(userId: string): Promise<void> {
        const user = await this.userService.isIdUserExist(userId);
        if (!user) {
            throw new BadRequestException('Một hoặc nhiều userId không tồn tại');
        }
    }
    private async checkDepartmentExistence(departmentId: string): Promise<void> {
        const department = await this.departmentService.isIdDepartmentExist(departmentId);
        if (!department) {
            throw new BadRequestException('Một hoặc nhiều departmentId không tồn tại');
        }
    }
    private async checkTechnologyExistence(techId: string): Promise<void> {
        const technology = await this.technologyService.technologyExist(techId);
        if (!technology) {
            throw new BadRequestException('Một hoặc nhiều technologId không tồn tại');
        }
    }
    private async checkRoleExistence(roleId: string): Promise<void> {
        const role = await this.roleService.isIdRoleExist(roleId);
        if (!role) {
            throw new BadRequestException('Một hoặc nhiều roleId không tồn tại');
        }
    }
    private async checkCustomerExistence(customerId: string): Promise<void> {
        const customer = await this.customerService.isIdCustomerExist(customerId);
        if (!customer) {
            throw new BadRequestException('Một hoặc nhiều customerId không tồn tại');
        }
    }
    private async checkPermissionExistence(permissionId: string): Promise<void> {
        const permission = await this.permissionService.isIdPermissionExist(permissionId);
        if (!permission) {
            throw new BadRequestException('Một hoặc nhiều permissionId không tồn tại');
        }
    }
    private async checkProjectExistence(projectId: string): Promise<void> {
        const project = await this.projectService.isIdProjectExist(projectId);
        if (!project) {
            throw new BadRequestException('Một hoặc nhiều projectId không tồn tại');
        }
    }
    private async checkProjectTypeExistence(typeId: string): Promise<void> {
        const type = await this.projectTypeService.isIdProjectTypeExist(typeId);
        if (!type) {
            throw new BadRequestException('Một hoặc nhiều typeId không tồn tại');
        }
    }
    private async checkStatusExistence(statusId: string): Promise<void> {
        const status = await this.statusService.isIdStatusExist(statusId);
        if (!status) {
            throw new BadRequestException('Một hoặc nhiều statusId không tồn tại');
        }
    }
}