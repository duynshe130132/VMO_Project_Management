import { BadRequestException, Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ExportExcelService } from './export-excel.service';
import { IUser } from 'src/modules/users/user.interface';
import { User } from 'src/decorator/user.decorator';
import { ApiQuery } from '@nestjs/swagger';



@Controller('export')
export class ExportExcelController {
    constructor(private readonly exportExcelService: ExportExcelService) { }

    @ApiQuery({ name: 'name', required: false, type: String })
    @ApiQuery({ name: 'technologyId', required: false, type: String })
    @ApiQuery({ name: 'departmentId', required: false, type: String })
    @ApiQuery({ name: 'projectId', required: false, type: String })

    @Get('users')
    async exportUsers(
        @User() user: IUser,
        @Res() response: Response,
        @Query('name') name?: string,  // Tìm kiếm theo tên
        @Query('technologyId') technologyId?: string,  // Tìm kiếm theo công nghệ
        @Query('departmentId') departmentId?: string,
        @Query('projectId') projectId?: string, // Tìm kiếm theo phòng ban
    ): Promise<void> {
        await this.exportExcelService.exportUsers(response, user, { name, technologyId, departmentId, projectId });
    }

    @ApiQuery({ name: 'startDate', required: false, type: Date })
    @ApiQuery({ name: 'endDate', required: false, type: Date })
    @ApiQuery({ name: 'projectTypeId', required: false, type: String })
    @ApiQuery({ name: 'statusId', required: false, type: String })
    @ApiQuery({ name: 'technologyId', required: false, type: String })
    @ApiQuery({ name: 'customerId', required: false, type: String })
    @Get('projects')
    async exportProjects(
        @User() user: IUser,
        @Res() response: Response,
        @Query('startDate') startDate?: Date,
        @Query('endDate') endDate?: Date,
        @Query('projectTypeId') projectTypeId?: string,
        @Query('statusId') statusId?: string,
        @Query('technologyId') technologyId?: string,
        @Query('customerId') customerId?: string,
    ): Promise<void> {
        await this.exportExcelService.exportProjects(response, user, { startDate, endDate, projectTypeId, statusId, technologyId, customerId });
    }
}
