import { BadRequestException, Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { IRole, ITechnology, IDepartment, IUser } from 'src/modules/users/schema/user.schema';
import { UsersService } from 'src/modules/users/users.service';
import { IUser as userInterface } from 'src/modules/users/user.interface';
import { DepartmentsService } from 'src/modules/departments/departments.service';
import { ProjectsService } from 'src/modules/projects/projects.service';
import { IStatus, IType } from 'src/modules/projects/schema/project.schema';


@Injectable()
export class ExportExcelService {
    constructor(
        private userService: UsersService,
        private departmentService: DepartmentsService,
        private projectService: ProjectsService
    ) { }
    async generateExcel(
        response: Response,
        data: any[],
        columns: { header: string; key: string; width?: number }[],
        fileName: string,
    ): Promise<void> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Report');

        // Cấu hình cột
        worksheet.columns = columns;

        // Thêm dữ liệu vào sheet
        data.forEach((item) => worksheet.addRow(item));

        // Thiết lập header HTTP
        response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        response.setHeader('Content-Disposition', `attachment; filename=${fileName}.xlsx`);

        // Ghi dữ liệu vào response
        try {
            await workbook.xlsx.write(response);
        } catch (error) {
            console.error('Lỗi khi ghi file Excel:', error);
            throw error;
        }
        response.end();
    }

    async exportUsers(response: Response, user: userInterface, filters: { name: string, technologyId: string, departmentId: string, projectId: string }): Promise<void> {
        try {

            const role = user.roleName;
            let users;

            if (filters.projectId) {
                filters.projectId = filters.projectId.trim();
            }
            if (filters.departmentId) {
                filters.departmentId = filters.departmentId.trim();
            }
            if (filters.technologyId) {
                filters.technologyId = filters.technologyId.trim();
            }
            if (filters.name) {
                filters.name = filters.name.trim();
            }
            if (filters.projectId && filters.departmentId) {
                const isValidProject = await this.checkProjectBelongsToDepartment(filters.departmentId, filters.projectId);
                if (!isValidProject) {
                    throw new BadRequestException('Project does not belong to the specified department');
                }
            }

            switch (role) {
                case "Admin":
                    users = await this.userService.findAllByAdminFilters(filters);
                    break;
                case "Manager":
                    if (!filters.departmentId && !filters.projectId) {
                        throw new BadRequestException('departmentId is required for managers');
                    }
                    users = await this.userService.findAllByManagerFilters(user, filters);
                    break;
            }
            const columns = [
                { header: 'Tên', key: 'name', width: 20 },
                { header: 'Email', key: 'email', width: 30 },
                { header: 'CCCD', key: 'cccd', width: 20 },
                { header: 'SĐT', key: 'phone', width: 15 },
                { header: 'Công nghệ', key: 'technologyId', width: 30 },
                { header: 'Vai trò ID', key: 'roleId', width: 15 },
                { header: 'Kinh nghiệm', key: 'yearExp', width: 10 },
                { header: 'Chứng chỉ', key: 'certificate', width: 20 },
                { header: 'Phòng ban ', key: 'departmentId', width: 15 },
                { header: 'Người tạo', key: 'createdBy', width: 20 },
            ];

            let projectName: string | undefined;
            if (filters.projectId) {
                const project = await this.projectService.findOne(filters.projectId);
                projectName = project.name;
                columns.push({ header: 'Dự án', key: 'project', width: 30 });
                console.log("Check project", projectName)
            }

            const transformedUsers = users.map(user => {
                return {
                    name: user.name,
                    email: user.email,
                    cccd: user.cccd,
                    phone: user.phone,
                    technologyId: Array.isArray(user.technologyId)
                        ? user.technologyId.map(tech => tech.name).join(', ')
                        : (user.technologyId as ITechnology).name,
                    roleId: user.roleId && (user.roleId as IRole).name ? (user.roleId as IRole).name : 'Chưa xác định',
                    yearExp: user.yearExp + ' years',
                    certificate: user.certificate ? user.certificate.map(cert => cert.name).join(', ') : 'Không có chứng chỉ', // Nếu không có chứng chỉ
                    departmentId: Array.isArray(user.departmentId)
                        ? user.departmentId.map(department => department.name).join(', ')
                        : (user.departmentId as IDepartment).name,
                    createdBy: user.createdBy && (user.createdBy as IUser).email ? (user.createdBy as IUser).email : 'N/A',
                    project: filters.projectId ? projectName : 'Không có dự án' // Gán giá trị dự án nếu có
                };
            });

            await this.generateExcel(response, transformedUsers, columns, 'Users_Report');
        } catch (error) {
            throw new BadRequestException(error.message)
        }
    }

    async exportProjects(response: Response, user: userInterface, filters: { startDate: Date, endDate: Date, projectTypeId: string, statusId: string, technologyId: string, customerId: string }): Promise<void> {
        try {

            const role = user.roleName;
            let projects;

            if (filters.projectTypeId) {
                filters.projectTypeId = filters.projectTypeId.trim();
            }
            if (filters.statusId) {
                filters.statusId = filters.statusId.trim();
            }
            if (filters.technologyId) {
                filters.technologyId = filters.technologyId.trim();
            }

            switch (role) {
                case "Admin":
                    projects = await this.projectService.findAllByAdminFilters(filters);
                    break;
                case "Manager":
                    projects = await this.projectService.findAllByManagerFilters(user, filters);
                    break;
            }
            const columns = [
                { header: 'Tên', key: 'name', width: 20 },
                { header: 'Thông tin', key: 'description', width: 30 },
                { header: 'Ngày bắt đầu', key: 'startDate', width: 20 },
                { header: 'Ngày kết thúc', key: 'endDate', width: 15 },
                { header: 'Loại dự án', key: 'projectTypeId', width: 30 },
                { header: 'Trạng thái', key: 'statusId', width: 15 },
                { header: 'Công nghệ', key: 'technologyId', width: 10 },
                { header: 'Thành viên', key: 'userId', width: 20 },
                { header: 'Người tạo', key: 'createdBy', width: 20 },
            ];


            const transformedProjects = projects.map(project => {
                return {
                    name: project.name,
                    description: project.description,
                    startDate: project.startDate ? new Date(project.startDate).toLocaleDateString('vi-VN') : 'Chưa xác định',
                    endDate: project.endDate ? new Date(project.endDate).toLocaleDateString('vi-VN') : 'Chưa xác định',
                    projectTypeId: project.projectTypeId && (project.projectTypeId as IType).name ? (project.projectTypeId as IType).name : 'Chưa xác định',
                    statusId: project.statusId && (project.statusId as IStatus).name ? (project.statusId as IStatus).name : 'Chưa xác định',
                    technologyId: Array.isArray(project.technologyId)
                        ? project.technologyId.map(tech => tech.name).join(', ')
                        : (project.technologyId as ITechnology).name,
                    userId: Array.isArray(project.userId)
                        ? project.userId.map(u => u.name).join(', ')
                        : (project.userId as IUser).name,
                    createdBy: project.createdBy && (project.createdBy as IUser).email ? (project.createdBy as IUser).email : 'N/A',
                };
            });
            console.log(transformedProjects)

            await this.generateExcel(response, transformedProjects, columns, 'Projects_Report');
        } catch (error) {
            throw new BadRequestException(error.message)
        }
    }


    //////////////////////////
    async checkProjectBelongsToDepartment(departmentId: string, projectId: string): Promise<boolean> {
        let isExist;
        const department = await this.departmentService.findOne(departmentId)
        if (!department) throw new BadRequestException('Not found department');

        const prjId = department.projectId;
        isExist = prjId.some(id => id.toString() === projectId)

        return isExist;
    }

}
