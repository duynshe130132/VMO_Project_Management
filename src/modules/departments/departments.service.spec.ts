import mongoose, { Model } from "mongoose";
import { DepartmentsService } from "./departments.service";
import { Department } from "./schema/department.schema";
import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { DepartmentRelationshipService } from "./department-relationship.service";
import { UsersService } from "../users/users.service";
import { PaginationService } from "../_shared/paginate/pagination.service";
import { BadRequestException } from "@nestjs/common";

describe('DepertmentsService', () => {
    let service: DepartmentsService;
    let departmentModel: Model<Department>;
    const mockDepartmentModel = {
        findOne: jest.fn(),
        find: jest.fn(),
        create: jest.fn(),
        updateOne: jest.fn(),
        softDelete: jest.fn(),
    }
    const mockDepartmentRealtionService = {
        checkDepartmentRelations: jest.fn().mockReturnValue(false)
    }
    const mockUserService = {
        findAllDepByUserId: jest.fn(),
        findOne: jest.fn(),
        findAllUser: jest.fn(),
        updateOne: jest.fn(),
        updateDepartmentId: jest.fn(),
        findUserByDepId: jest.fn(),
    };
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DepartmentsService,
                {
                    provide: getModelToken(Department.name),
                    useValue: mockDepartmentModel,
                },
                {
                    provide: DepartmentRelationshipService,
                    useValue: mockDepartmentRealtionService,
                },
                {
                    provide: UsersService,
                    useValue: mockUserService,
                },
                PaginationService,
            ]
        }).compile();
        service = module.get<DepartmentsService>(DepartmentsService);
        departmentModel = module.get<Model<Department>>(getModelToken(Department.name));
    })
    afterEach(() => {
        jest.resetAllMocks();
    })

    describe('Create', () => {
        const mockCreateDepartment = {
            name: 'Test Department',
            description: 'Test Description',
            foundingDate: new Date(2000, 1, 1),
            user_managerId: 'managerId',
            projectId: ['testP1', 'testP2'],
        }
        const mockManager = {
            _id: 'managerId',
            name: 'Nng',
            email: 'nng@gmail.com',
            roleId: { _id: 'roleManager', name: 'Manager' },
            roleName: 'Manager'
        }
        const mockAdmin = {
            _id: 'adminId',
            name: 'adm',
            email: 'adm@gmail.com',
            roleId: 'roleAdmin',
            roleName: 'Admin'
        }
        it('Should create successfully', async () => {
            mockDepartmentModel.findOne.mockImplementationOnce(() => Promise.resolve(null));
            mockDepartmentModel.find.mockResolvedValue([]);
            mockUserService.findOne.mockResolvedValue(mockManager);

            const mockNewDepartment = {
                ...mockCreateDepartment,
                _id: 'newDepartmentId',
                createdBy: mockAdmin._id
            };
            mockDepartmentModel.create.mockResolvedValue(mockNewDepartment);

            mockUserService.updateDepartmentId.mockResolvedValue({ modifiedCount: 1 });

            const result = await service.create(mockCreateDepartment, mockAdmin);
            expect(result).toStrictEqual(mockNewDepartment);

            expect(mockDepartmentModel.create).toHaveBeenCalledWith({
                ...mockCreateDepartment,
                createdBy: mockAdmin._id,
            });
        })
        it('Should throw error when name already exists', async () => {
            mockDepartmentModel.findOne.mockResolvedValue({ name: 'nameTest' });

            await expect(service.create(mockCreateDepartment, mockAdmin)).rejects.toThrowError(
                'Department already exists'
            )
        })
        it('Should throw error when Manager already exist in another department', async () => {
            mockDepartmentModel.findOne.mockImplementationOnce(() => Promise.resolve(null));
            mockUserService.findOne.mockResolvedValue(mockManager);
            mockDepartmentModel.find.mockResolvedValue(['dep1', 'dep2']);
            await expect(service.create(mockCreateDepartment, mockAdmin)).rejects.toThrowError(
                'Manager already exist in another department'
            )
        })
    })
    describe('GetAll', () => {
        const mockAdmin = {
            _id: 'adminId', name: 'adm', email: 'adm@gmail.com', roleId: 'roleAdmin', roleName: 'Admin'
        }
        const mockManager = {
            _id: 'managerId', name: 'Nng', email: 'nng@gmail.com', roleId: 'roleManager', roleName: 'Manager'
        }
        const mockEmployee = {
            _id: 'employeeId', name: 'emp', email: 'emp@gmail.com', roleId: 'roleEmployee', roleName: 'Employee'
        }
        const mockEmp = {
            _id: 'employeeId', name: 'emp', departmentId: ['dep1', 'dep2']
        }
        const mockDepartments = [
            { _id: 'dep1', name: 'department1', user_managerId: 'managerId' },
            { _id: 'dep2', name: 'department2', user_managerId: 'managerId1' },
            { _id: 'dep3', name: 'department3', user_managerId: 'managerId2' }
        ]
        it('Should get all department when role is Admin', async () => {
            mockDepartmentModel.find.mockResolvedValue(mockDepartments);
            const mockPaginate = {
                meta: {
                    current: 1,
                    pageSize: 10,
                    pages: 1,
                    total: 3
                },
                result: mockDepartments
            }
            const results = await service.listAllDepartment(mockAdmin, 1, 10, '');
            expect(results).toStrictEqual(mockPaginate);
        })
        it('Should get all manager department when role is Manager', async () => {
            const mockManagerDeps = [mockDepartments[0]];
            mockDepartmentModel.find.mockResolvedValue(mockManagerDeps);
            const mockPaginate = {
                meta: {
                    current: 1,
                    pageSize: 10,
                    pages: 1,
                    total: 1
                },
                result: mockManagerDeps
            }
            const results = await service.listAllDepartment(mockManager, 1, 10, '')
            expect(results).toStrictEqual(mockPaginate);
        })
        it('Should get all employee department when role is employee', async () => {
            mockUserService.findAllDepByUserId.mockResolvedValue(['dep1', 'dep2']);
            const mockEmpDeps = [mockDepartments[0], mockDepartments[1]];
            mockDepartmentModel.find.mockResolvedValue(mockEmpDeps);
            const mockPaginate = {
                meta: {
                    current: 1,
                    pageSize: 10,
                    pages: 1,
                    total: 2
                },
                result: mockEmpDeps
            }
            const results = await service.listAllDepartment(mockEmployee, 1, 10, '');
            expect(results).toStrictEqual(mockPaginate);
        })
    })
    describe('getById', () => {
        const mockAdmin = {
            _id: 'adminId', name: 'adm', email: 'adm@gmail.com', roleId: 'roleAdmin', roleName: 'Admin'
        }
        const mockManager = {
            _id: 'managerId', name: 'Nng', email: 'nng@gmail.com', roleId: 'roleManager', roleName: 'Manager'
        }
        const mockEmployee = {
            _id: 'employeeId', name: 'emp', email: 'emp@gmail.com', roleId: 'roleEmployee', roleName: 'Employee'
        }
        const mockEmp = [
            { _id: 'employeeId', name: 'emp', departmentId: ['dep1', 'dep2'] },
            { _id: 'employeeId1', name: 'emp1', departmentId: ['dep3', 'dep4'] },
        ]
        const mockDepartments = [
            { _id: 'dep1', name: 'department1', user_managerId: 'managerId' },
            { _id: 'dep2', name: 'department2', user_managerId: 'managerId1' },
            { _id: 'dep3', name: 'department3', user_managerId: 'managerId2' }
        ]
        it('Should return any department by id when role is Admin', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockDepartmentModel.findOne.mockResolvedValue(mockDepartments[1]);

            const result = await service.getById('dep2', mockAdmin);
            expect(result).toStrictEqual(mockDepartments[1]);
            expect(mockDepartmentModel.findOne).toHaveBeenCalledWith(
                {
                    _id: 'dep2',
                    $or: [
                        { isDeleted: { $exists: false } },
                        { isDeleted: false },
                    ]
                }
            )
        })
        it('Should return manager department by id when role is Manager', async () => {
            mockDepartmentModel.find.mockResolvedValue([mockDepartments[0]]);
            mockDepartmentModel.findOne.mockResolvedValue(mockDepartments[0]);

            const result = await service.getById('dep1', mockManager);
            expect(result).toStrictEqual(mockDepartments[0]);
            expect(mockDepartmentModel.findOne)
        })
        it('Should return employee department by id when role is Employee', async () => {
            mockUserService.findUserByDepId.mockResolvedValue([mockEmp[0]]);
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockDepartmentModel.findOne.mockResolvedValue(mockDepartments[1]);

            const result = await service.getById('dep2', mockEmployee);
            expect(result).toStrictEqual(mockDepartments[1]);
            expect(mockDepartmentModel.findOne).toHaveBeenCalledWith(
                {
                    _id: 'dep2',
                    $or: [
                        { isDeleted: { $exists: false } },
                        { isDeleted: false },
                    ]
                }
            )
        })
    })
    describe('Update', () => {
        const mockAdmin = {
            _id: 'adminId', name: 'adm', email: 'adm@gmail.com', roleId: 'roleAdmin', roleName: 'Admin'
        }
        const mockManager = [
            { _id: 'managerId', name: 'Nng', email: 'nng@gmail.com', roleId: { _id: 'roleManager', name: 'Manager' }, roleName: 'Manager' },
            { _id: 'managerId1', name: 'Nng1', email: 'nng1@gmail.com', roleId: { _id: 'roleManager', name: 'Manager' }, roleName: 'Manager' },
        ]
        const mockDepartment = [
            { _id: 'dep1', name: 'alibaba', user_managerId: 'managerId' },
            { _id: 'dep2', name: 'ahaha', user_managerId: 'managerId1' }
        ]

        it('Should update successfully when field managerId not change', async () => {
            const mockUpdateDto = { _id: 'dep1', name: 'demo1', user_managerId: 'managerId' }
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockDepartmentModel.findOne.mockImplementationOnce(() => Promise.resolve(mockDepartment[0]));

            mockUserService.findOne.mockResolvedValue(mockManager[0])
            mockDepartmentModel.updateOne.mockResolvedValue({ nModified: 1 });
            const result = await service.update(mockUpdateDto, mockAdmin);
            expect(result.message).toBe('Update department successfully')
        })
        it('Should update successfully when field managerId is change', async () => {
            const mockUpdateDto = { _id: 'dep1', name: 'demo1', user_managerId: 'managerId1' }

            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockDepartmentModel.findOne.mockImplementationOnce(() => Promise.resolve(mockDepartment[0]));
            mockUserService.findOne.mockResolvedValue(mockManager[1])

            mockDepartmentModel.find.mockResolvedValue([]);
            mockDepartmentModel.updateOne.mockResolvedValue({ nModified: 1 });
            const result = await service.update(mockUpdateDto, mockAdmin);

            mockUserService.updateDepartmentId({ nModified: 1 });
            expect(result.message).toBe('Update department successfully')
            expect(mockDepartmentModel.find).toHaveBeenCalledWith(
                {
                    user_managerId: 'managerId1'
                }
            )
            expect(mockUserService.updateDepartmentId).toHaveBeenCalled();
        })
        it('Should throw an error when when field managerId is change but Manager already exists in another department', async () => {
            const mockUpdateDto = { _id: 'dep1', name: 'demo1', user_managerId: 'managerId1' }
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockDepartmentModel.findOne.mockImplementationOnce(() => Promise.resolve(mockDepartment[0]));
            mockUserService.findOne.mockResolvedValue(mockManager[1])

            mockDepartmentModel.find.mockResolvedValue([mockDepartment[1]]);

            await expect(service.update(mockUpdateDto, mockAdmin)).rejects.toThrowError(
                new BadRequestException('Manager already exists in another department')
            )
            expect(mockDepartmentModel.find).toHaveBeenCalledWith(
                {
                    user_managerId: 'managerId1'
                }
            )
        })
    })
    describe('remove', () => {
        const mockAdmin = {
            _id: 'adminId', name: 'adm', email: 'adm@gmail.com', roleId: 'roleAdmin', roleName: 'Admin'
        }
        const mockDepartment = [
            { _id: 'dep1', name: 'alibaba', user_managerId: 'managerId' },
            { _id: 'dep2', name: 'ahaha', user_managerId: 'managerId1' }
        ]
        it('Should remove department successfully', async () => {
            mockDepartmentRealtionService.checkDepartmentRelations.mockResolvedValue(false);
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockDepartmentModel.findOne.mockResolvedValue(mockDepartment[0]);
            mockDepartmentModel.updateOne.mockResolvedValue({ nModified: 1 });
            mockDepartmentModel.softDelete.mockResolvedValue(true);
            const result = await service.remove('dep1', mockAdmin);

            expect(result.message).toBe('Remove department successfully');
            expect(mockDepartmentModel.findOne).toHaveBeenCalledWith(
                {
                    _id: 'dep1',
                    $or: [
                        { isDeleted: { $exists: false } },
                        { isDeleted: false },
                    ]
                }
            )
            expect(mockDepartmentModel.updateOne).toHaveBeenCalled();
            expect(mockDepartmentModel.softDelete).toHaveBeenCalled();
        })
        it('Shoud throw error when department is linked to another object', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockDepartmentRealtionService.checkDepartmentRelations.mockResolvedValue(true);
            await expect(service.remove('dep1', mockAdmin)).rejects.toThrowError(
                new BadRequestException("Can't remove department because it's linked to user")
            )
        })
        it('Should throw error when not found department to remove', async () => {
            mockDepartmentRealtionService.checkDepartmentRelations.mockResolvedValue(false);
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockDepartmentModel.findOne.mockResolvedValue(null);
            await expect(service.remove('dep3', mockAdmin)).rejects.toThrowError(
                new BadRequestException("Not found department")
            )
        })
    })
})