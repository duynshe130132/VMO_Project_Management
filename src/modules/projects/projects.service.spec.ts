import mongoose, { Model } from "mongoose";
import { ProjectsService } from "./projects.service";
import { Project } from "./schema/project.schema";
import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { ProjectRelationshipService } from "./project-relationship.service";
import { PaginationService } from "../_shared/paginate/pagination.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { DepartmentsService } from "../departments/departments.service";
import { ProjecttypesService } from "../projecttypes/projecttypes.service";
import { StatusService } from "../status/status.service";
import { TechnologiesService } from "../technologies/technologies.service";
import { CustomersService } from "../customers/customers.service";
import { UsersService } from "../users/users.service";
import { BadRequestException } from "@nestjs/common";
describe('ProjectsService', () => {
    let service: ProjectsService;
    let projectModel: Model<Project>;

    const mockProjectModel = {
        findOne: jest.fn(),
        find: jest.fn(),
        create: jest.fn(),
        updateOne: jest.fn(),
        softDelete: jest.fn(),
    }
    const mockProjectRealtionService = {
        checkProjectRelations: jest.fn().mockReturnValue(false)
    }
    const mockDepartmentsService = {
        findManagerDepartment: jest.fn(),
        findOne: jest.fn(),
        findByProjectId: jest.fn(),
    };
    const mockTypesService = {

    };
    const mockStatusService = {

    };
    const mockTechnologyService = {

    };
    const mockCustomerService = {

    };
    const mockUserService = {
        findAllDepByUserId: jest.fn(),
        findOne: jest.fn(),
        findAllUser: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProjectsService,
                {
                    provide: getModelToken(Project.name),
                    useValue: mockProjectModel,
                },
                {
                    provide: ProjectRelationshipService,
                    useValue: mockProjectRealtionService,
                },
                {
                    provide: DepartmentsService,
                    useValue: mockDepartmentsService,
                },
                {
                    provide: ProjecttypesService,
                    useValue: mockTypesService,
                },
                {
                    provide: StatusService,
                    useValue: mockStatusService,
                },
                {
                    provide: TechnologiesService,
                    useValue: mockTechnologyService,
                },
                {
                    provide: CustomersService,
                    useValue: mockCustomerService,
                },
                {
                    provide: UsersService,
                    useValue: mockUserService,
                },
                PaginationService,
            ]
        }).compile();
        service = module.get<ProjectsService>(ProjectsService);
        projectModel = module.get<Model<Project>>(getModelToken(Project.name));
    })
    afterEach(() => {
        jest.resetAllMocks();
    })

    describe('create', () => {
        const mockProjectSample = {
            name: 'Test project 1',
            description: "Description for project 1",
            startDate: new Date('2022-01-01'),
            endDate: new Date('2022-02-01'),
            projectTypeId: 'project_type_id' as any,
            statusId: 'status_id' as any,
            technologyId: ['tech_id1', 'tech_id2'] as any,
            userId: [] as any,
            customerId: 'customer_id' as any
        }
        const mockUser = { _id: 'user_id' } as any

        it('Should create project successfully', async () => {
            const mockCreate: CreateProjectDto = mockProjectSample;
            mockProjectModel.findOne.mockResolvedValue(null);
            mockProjectModel.create.mockResolvedValue(mockCreate);

            const result = await service.create(mockCreate, mockUser);

            expect(result).toStrictEqual(mockCreate);
            expect(mockProjectModel.create).toHaveBeenCalledWith(
                {
                    ...mockCreate,
                    createdBy: mockUser._id,
                }
            )
        });
        it('Should throw BadrequestException if project name already exists', async () => {
            const mockCreateProject = mockProjectSample;
            mockProjectModel.findOne.mockResolvedValue({ name: mockCreateProject.name });
            await expect(service.create(mockCreateProject, mockUser)).rejects.toThrowError(
                new BadRequestException("Project already exists")
            )
        })
        it('Should throw BadrequestException if userId is provided but not added to department', async () => {
            const mockCreateProject = {
                name: 'Test project 1',
                description: "Description for project 1",
                startDate: new Date('2022-01-01'),
                endDate: new Date('2022-02-01'),
                projectTypeId: 'project_type_id' as any,
                statusId: 'status_id' as any,
                technologyId: ['tech_id1', 'tech_id2'] as any,
                userId: ['1', '2', '3'] as any,
                customerId: 'customer_id' as any
            };
            mockProjectModel.findOne.mockResolvedValue(null);
            await expect(service.create(mockCreateProject, mockUser)).rejects.toThrowError(
                new BadRequestException("You can only add users to this project after adding the project to the department")
            )
        });
        it('Should throw BadrequestException if status is Cancelled', async () => {
            const mockCreateProject = {
                name: 'Test project 1',
                description: "Description for project 1",
                startDate: new Date('2022-01-01'),
                endDate: new Date('2022-02-01'),
                projectTypeId: 'project_type_id' as any,
                statusId: '6732f6d2e8d78e9f0cc1af6a' as any,
                technologyId: ['tech_id1', 'tech_id2'] as any,
                userId: [] as any,
                customerId: 'customer_id' as any
            };
            mockProjectModel.findOne.mockResolvedValue(null);
            await expect(service.create(mockCreateProject, mockUser)).rejects.toThrowError(
                new BadRequestException("Cannot create a project with 'Cancelled' status")
            );
        })
    })
    describe('findAll', () => {

        it('Should call findAll when role is Admin', async () => {
            const mockResults = ['project1', 'project2'];
            const mockPagination = {
                meta: {
                    current: 1,
                    pageSize: 10,
                    pages: 1,
                    total: 2
                },
                result: mockResults
            }
            const mockUser = {
                _id: 'idAdmin',
                name: 'Duy',
                email: 'acb@gmail.com',
                roleId: 'roleAdmin',
                roleName: 'Admin',
            };

            mockProjectModel.find.mockResolvedValue(mockResults);
            const results = await service.listAll(mockUser, 1, 10, '');
            expect(results).toStrictEqual(mockPagination);
            expect(mockProjectModel.find).toHaveBeenCalled();
        })

        it('Should call findAllManagerProject when role is Manager', async () => {
            const mockManagerProjects = ['managerProject1', 'managerProject2'];
            const mockManagerDepartments = [
                { projectId: 'projectId1' },
                { projectId: 'projectId2' },
            ];
            const mockPagination = {
                meta: {
                    current: 1,
                    pageSize: 10,
                    pages: 1,
                    total: 2
                },
                result: mockManagerProjects
            };
            const mockUser = {
                _id: 'idManager',
                name: 'Linh',
                email: 'linh@gmail.com',
                roleId: 'roleManager',
                roleName: 'Manager',
            };
            mockDepartmentsService.findManagerDepartment.mockResolvedValue(mockManagerDepartments);
            mockProjectModel.findOne
                .mockResolvedValueOnce(mockManagerProjects[0])
                .mockResolvedValueOnce(mockManagerProjects[1])

            const results = await service.listAll(mockUser, 1, 10, '');

            expect(results).toStrictEqual(mockPagination);
            expect(mockDepartmentsService.findManagerDepartment).toHaveBeenCalledWith(mockUser._id);
            expect(mockProjectModel.findOne).toHaveBeenCalledTimes(2);
            expect(mockProjectModel.findOne).toHaveBeenCalledWith({ _id: 'projectId1' });
            expect(mockProjectModel.findOne).toHaveBeenCalledWith({ _id: 'projectId2' });
        });

        it('Should call listAllEmployeeProject when role is Employee', async () => {
            const mockProjects = [
                {
                    _id: 'project1',
                    name: 'Project 1',
                    userId: ['empId123', 'empId456']
                },
                {
                    _id: 'project2',
                    name: 'Project 2',
                    userId: ['empId789']
                },
                {
                    _id: 'project3',
                    name: 'Project 3',
                    userId: ['empId123']
                }
            ];
            const expectedProjects = [mockProjects[0], mockProjects[2]];

            const mockPagination = {
                meta: {
                    current: 1,
                    pageSize: 10,
                    pages: 1,
                    total: 2
                },
                result: expectedProjects
            };
            const mockUser = {
                _id: 'empId123',
                name: 'Linh',
                email: 'linh@gmail.com',
                roleId: 'roleEmployee',
                roleName: 'Employee',
            };
            mockProjectModel.find.mockResolvedValue(mockProjects);
            const results = await service.listAll(mockUser, 1, 10, '');

            expect(results).toStrictEqual(mockPagination);
            expect(mockProjectModel.find).toHaveBeenCalled();
        })
        it('Should throw badRequestException when invalid role', async () => {
            const mockUser = {
                _id: 'empId123',
                name: 'Linh',
                email: 'linh@gmail.com',
                roleId: '',
                roleName: '',
            };
            await expect(service.listAll(mockUser, 1, 10, '')).rejects.toThrowError(
                new BadRequestException("Invalid role")
            );
        })
    })
    describe('findById', () => {
        it('Should call findOne when role is Admin', async () => {

            const mockProjects = [
                {
                    _id: 'project1',
                    name: 'Project 1',
                    userId: ['empId123', 'empId456']
                },
                {
                    _id: 'project2',
                    name: 'Project 2',
                    userId: ['empId789']
                },
                {
                    _id: 'project3',
                    name: 'Project 3',
                    userId: ['empId123']
                }
            ];
            const mockUser = {
                _id: 'idAdmin',
                name: 'Duy',
                email: 'acb@gmail.com',
                roleId: 'roleAdmin',
                roleName: 'Admin',
            };

            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockProjectModel.findOne.mockResolvedValue(mockProjects[0]);
            const result = await service.getById(mockProjects[0]._id, mockUser);

            expect(result).toStrictEqual(mockProjects[0])
            expect(mockProjectModel.findOne).toHaveBeenCalledWith(
                {
                    _id: mockProjects[0]._id,
                    $or: [
                        { isDeleted: { $exists: false } },
                        { isDeleted: false },
                    ]
                }
            )
        })
        it('Should found a project in department for manager', async () => {
            const mockManagerDepartments = [
                { _id: '1', projectId: ['projectId1'] },
                { _id: '2', projectId: ['projectId2'] },
            ];
            const mockProjects = [
                {
                    _id: 'projectId1',
                    name: 'Project 1',
                    userId: ['empId123', 'empId456']
                },
                {
                    _id: 'projectId2',
                    name: 'Project 2',
                    userId: ['empId789']
                },
                {
                    _id: 'projectId3',
                    name: 'Project 3',
                    userId: ['empId123']
                }
            ];
            const mockUser = {
                _id: 'idManager',
                name: 'Duy',
                email: 'acb@gmail.com',
                roleId: 'roleManager',
                roleName: 'Manager',
            };

            mockDepartmentsService.findManagerDepartment.mockResolvedValue(mockManagerDepartments);
            const isProjectFound = mockManagerDepartments.some(d =>
                d.projectId.some(id => id === mockProjects[0]._id) // `id === projectId` vì cả hai là string
            );
            if (!isProjectFound) throw new BadRequestException('not found project in department');

            // Kiểm tra kết quả
            expect(isProjectFound).toBe(true);

            mockProjectModel.findOne.mockResolvedValue(mockProjects[0]);

            const result = await service.getById(mockProjects[0]._id, mockUser);
            expect(result).toStrictEqual(mockProjects[0]);
            expect(mockDepartmentsService.findManagerDepartment).toHaveBeenCalledWith(mockUser._id);
            expect(mockProjectModel.findOne).toHaveBeenCalledWith({ _id: mockProjects[0]._id });
        })
        it("Should throw badrequetException when projectId not found in manager's department", async () => {
            const mockManagerDepartments = [
                { _id: '1', projectId: ['projectId1'] },
                { _id: '2', projectId: ['projectId2'] },
            ];
            const mockProjects = [
                {
                    _id: 'projectId11',
                    name: 'Project 1',
                    userId: ['empId123', 'empId456']
                },
                {
                    _id: 'projectId22',
                    name: 'Project 2',
                    userId: ['empId789']
                },
                {
                    _id: 'projectId3',
                    name: 'Project 3',
                    userId: ['empId123']
                }
            ];
            const mockUser = {
                _id: 'idManager',
                name: 'Duy',
                email: 'acb@gmail.com',
                roleId: 'roleManager',
                roleName: 'Manager',
            };
            mockDepartmentsService.findManagerDepartment.mockResolvedValue(mockManagerDepartments);
            const isProjectFound = mockManagerDepartments.some(d =>
                d.projectId.some(id => id === mockProjects[0]._id) // `id === projectId` vì cả hai là string
            );
            if (!isProjectFound)
                await expect(service.getById(mockProjects[0]._id, mockUser)).rejects.toThrowError(
                    new BadRequestException("not found project in department")
                )
            expect(isProjectFound).toBe(false);
        })
        it("Should found a project for Employee", async () => {
            const mockEmployeeDepartments = [
                { _id: '1', projectId: ['projectId1'] },
                { _id: '2', projectId: ['projectId2'] },
            ];
            const mockProjects = [
                {
                    _id: 'projectId1',
                    name: 'Project 1',
                    userId: ['empId123', 'empId456']
                },
                {
                    _id: 'projectId2',
                    name: 'Project 2',
                    userId: ['empId789']
                },
                {
                    _id: 'projectId3',
                    name: 'Project 3',
                    userId: ['empId123']
                }
            ];
            const mockUser = {
                _id: 'empId123',
                name: 'Duy',
                email: 'acb@gmail.com',
                roleId: 'roleEmployee',
                roleName: 'Employee',
            };
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockUserService.findAllDepByUserId.mockResolvedValue(['1', '2']);
            mockDepartmentsService.findOne
                .mockResolvedValueOnce({ _id: '1', projectId: ['projectId1'] }) // Department 1
                .mockResolvedValueOnce({ _id: '2', projectId: ['projectId2'] }); // Department 2

            const isExistInDepartment = mockEmployeeDepartments.some(d =>
                d.projectId.some(id => id === mockProjects[0]._id) // `id === projectId` vì cả hai là string
            );
            expect(isExistInDepartment).toBe(true);

            mockProjectModel.find.mockResolvedValue([mockProjects[0], mockProjects[1]]);

            const isProjectFound = mockProjects.some(d => d._id === 'projectId1');
            expect(isProjectFound).toBe(true);

            mockProjectModel.findOne.mockResolvedValue(mockProjects[0]);
            // Call the service method;
            const result = await service.getById('projectId1', mockUser); // Pass 'projectId1' as example projectId
            expect(result).toEqual(mockProjects[0]);
        })
        it('Should badRequest Exception when could not found project in employee department', async () => {
            const mockEmployeeDepartments = [
                { _id: '1', projectId: ['projectId11'] },
                { _id: '2', projectId: ['projectId22'] },
            ];
            const mockProjects = [
                {
                    _id: 'projectId1',
                    name: 'Project 1',
                    userId: ['empId123', 'empId456']
                },
                {
                    _id: 'projectId2',
                    name: 'Project 2',
                    userId: ['empId789']
                },
                {
                    _id: 'projectId3',
                    name: 'Project 3',
                    userId: ['empId123']
                }
            ];
            const mockUser = {
                _id: 'empId123',
                name: 'Duy',
                email: 'acb@gmail.com',
                roleId: 'roleEmployee',
                roleName: 'Employee',
            };

            mockUserService.findAllDepByUserId.mockResolvedValue(['1', '2']);
            mockDepartmentsService.findOne
                .mockResolvedValueOnce({ _id: '1', projectId: ['projectId11'] }) // Department 1
                .mockResolvedValueOnce({ _id: '2', projectId: ['projectId22'] }); // Department 2

            const isExistInDepartment = mockEmployeeDepartments.some(d =>
                d.projectId.some(id => id === 'projectId1') // `id === projectId` vì cả hai là string
            );
            expect(isExistInDepartment).toBe(false);
            await expect(service.getById('projectId1', mockUser)).rejects.toThrowError(
                new BadRequestException("Could not find project in your department")
            )
        })
        it('Should badRequest Exception when  not found project for employee', async () => {
            const mockEmployeeDepartments = [
                { _id: '1', projectId: ['projectId1'] },
                { _id: '2', projectId: ['projectId2'] },
            ];
            const mockProjects = [
                {
                    _id: 'projectId1',
                    name: 'Project 1',
                    userId: ['empId123', 'empId456']
                },
                {
                    _id: 'projectId2',
                    name: 'Project 2',
                    userId: ['empId789']
                },
                {
                    _id: 'projectId3',
                    name: 'Project 3',
                    userId: ['empId123']
                }
            ];
            const mockUser = {
                _id: 'empId123',
                name: 'Duy',
                email: 'acb@gmail.com',
                roleId: 'roleEmployee',
                roleName: 'Employee',
            };

            mockUserService.findAllDepByUserId.mockResolvedValue(['1', '2']);
            mockDepartmentsService.findOne
                .mockResolvedValueOnce({ _id: '1', projectId: ['projectId1'] }) // Department 1
                .mockResolvedValueOnce({ _id: '2', projectId: ['projectId2'] }); // Department 2

            const isExistInDepartment = mockEmployeeDepartments.some(d =>
                d.projectId.some(id => id === 'projectId2') // `id === projectId` vì cả hai là string
            );
            expect(isExistInDepartment).toBe(true);

            mockProjectModel.find.mockResolvedValue([mockProjects[0]]);

            await expect(service.getById('projectId2', mockUser)).rejects.toThrowError(
                new BadRequestException("Not found project")
            )
        })
    })
    describe('listByDepartmentId', () => {
        const mockAdmin = {
            _id: 'adminId',
            name: 'Adm',
            email: 'adm@gmail.com',
            roleId: 'roleAdmin',
            roleName: 'Admin',
        }
        const mockManager = {
            _id: 'managerId',
            name: 'Nng',
            email: 'nng@gmail.com',
            roleId: 'roleManager',
            roleName: 'Manager'
        }
        const mockDepartments = [
            { _id: '1', user_managerId: 'managerId', projectId: ['1', '2'] },
            { _id: '2', user_managerId: 'managerId2', projectId: ['3', '4'] }
        ]
        const mockProjects = [
            { _id: '1', name: 'Project 1', userId: ['empId123', 'empId456'] },
            { _id: '2', name: 'Project 2', userId: ['empId789'] },
            { _id: '3', name: 'Project 3', userId: ['empId123'] },
            { _id: '4', name: 'Project 4', userId: ['empId456'] },
        ]

        it('Should return projects when role is Admin', async () => {
            const mockAnyProjects = [mockProjects[2], mockProjects[3]];

            const mockPagination = {
                meta: {
                    current: 1,
                    pageSize: 10,
                    pages: 1,
                    total: 2
                },
                result: mockAnyProjects
            }

            mockDepartmentsService.findOne.mockResolvedValue('2');
            mockProjectModel.find.mockResolvedValue(mockAnyProjects);

            const results = await service.listAllInDepartment('2', mockAdmin, 1, 10, '');

            expect(results).toStrictEqual(mockPagination);
        })
        it('should return projects when role is Manager', async () => {
            const mockManagerProject = [mockProjects[0], mockProjects[1]];
            const mockPagination = {
                meta: {
                    current: 1,
                    pageSize: 10,
                    pages: 1,
                    total: 2
                },
                result: mockManagerProject
            }
            mockDepartmentsService.findManagerDepartment.mockResolvedValue([mockDepartments[0]]);
            mockProjectModel.findOne
                .mockResolvedValueOnce(mockManagerProject[0])
                .mockResolvedValueOnce(mockManagerProject[1]);


            const results = await service.listAllInDepartment('1', mockManager, 1, 10, '');
            expect(results).toStrictEqual(mockPagination);
            expect(mockDepartmentsService.findManagerDepartment).toHaveBeenCalledWith(mockManager._id);
            expect(mockProjectModel.findOne).toHaveBeenCalledWith({ _id: '1' });
            expect(mockProjectModel.findOne).toHaveBeenCalledWith({ _id: '2' });
        })
        it('Should throw badRequestException when invalid role', async () => {
            const mockeFakeUser = {
                _id: 'id',
                name: 'Nng',
                email: 'nng@gmail.com',
                roleId: 'roleManager',
                roleName: 'invalidRole'
            }

            await expect(service.listAllInDepartment('1', mockeFakeUser, 1, 10, '')).rejects.toThrowError(
                new BadRequestException('Invalid role')
            )
        })
    })

    describe('listByUserId', () => {
        const mockAdmin = {
            _id: 'adminId',
            name: 'Adm',
            email: 'adm@gmail.com',
            roleId: 'roleAdmin',
            roleName: 'Admin',
        }
        const mockUser = {
            _id: 'managerId',
            name: 'Nng',
            email: 'nng@gmail.com',
            roleId: 'roleManager',
            roleName: 'Manager'
        }
        const mockEmployee = [
            { _id: 'empId123', depaermentId: ['dep1'] }
        ]
        const mockDepartment = [
            { _id: 'dep1', userManagerId: 'managerId' }
        ]
        const mockProjects = [
            { _id: '1', name: 'Project 1', userId: ['empId123', 'empId456'] },
            { _id: '2', name: 'Project 2', userId: ['empId789'] },
            { _id: '3', name: 'Project 3', userId: ['empId123'] },
            { _id: '4', name: 'Project 4', userId: ['empId456'] },
        ]
        it('Should call findProjectByEmpId when role is Admin', async () => {
            const mockProjectFind = [mockProjects[0], mockProjects[2]];
            const userId = 'empId123';
            const mockPagination = {
                meta: {
                    current: 1,
                    pageSize: 10,
                    pages: 1,
                    total: 2
                },
                result: mockProjectFind
            }

            mockProjectModel.find.mockResolvedValue(mockProjectFind);
            const ExistProject = mockProjectFind.filter(p => p.userId.toString() === userId);
            // expect(isExistProject).toBe(true);
            expect(ExistProject.length).toBeGreaterThan(0);

            const results = await service.getByUserId(userId, mockAdmin, 1, 10, '');
            expect(results).toStrictEqual(mockPagination);
            expect(projectModel.find).toHaveBeenCalled();
        })

        it('Should call findProjectByEmployeeId when role is Manager', async () => {
            const mockDepartmentId = 'dep1'; // ID của phòng ban mà nhân viên thuộc về
            const mockProjectFind = [mockProjects[0], mockProjects[2]];
            const userId = 'empId123';
            const mockPagination = {
                meta: {
                    current: 1,
                    pageSize: 10,
                    pages: 1,
                    total: 2
                },
                result: mockProjectFind
            }
            mockDepartmentsService.findManagerDepartment.mockResolvedValue([{ _id: mockDepartmentId }]);

            // Mô phỏng nhân viên có departmentId là một mảng chứa ID phòng ban
            mockUserService.findOne.mockResolvedValue({
                _id: userId,
                departmentId: [mockDepartmentId]
            });
            const relevantProjects = [mockProjects[0], mockProjects[2]]; // Projects that should be returned for empId123
            mockProjectModel.find.mockResolvedValue(relevantProjects);

            const results = await service.getByUserId(userId, mockUser, 1, 10, '');

            expect(results).toStrictEqual(mockPagination);
            expect(mockDepartmentsService.findManagerDepartment).toHaveBeenCalledWith(mockUser._id);
            expect(mockUserService.findOne).toHaveBeenCalledWith(userId);
            expect(mockProjectModel.find).toHaveBeenCalled();
        })
        it('Should throw badRequestException when invalid role', async () => {
            const userId = 'empId123';
            const mockeFakeUser = {
                _id: 'id',
                name: 'Nng',
                email: 'nng@gmail.com',
                roleId: 'roleManager',
                roleName: 'invalidRole'
            }
            await expect(service.getByUserId(userId, mockeFakeUser, 1, 10, '')).rejects.toThrowError(
                new BadRequestException('Invalid role')
            )
        })
    })
    describe('Update', () => {
        const mockAdmin = {
            _id: 'adminId',
            name: 'Adm',
            email: 'adm@gmail.com',
            roleId: 'roleAdmin',
            roleName: 'Admin',
        }
        const mockProject = [
            { _id: '1', name: 'Project 1', userId: ['empId111', 'empId000'] },
            { _id: '2', name: 'Project 2', userId: ['empId999', 'empId696'] }
        ]
        const mockDepartments = [{ _id: 'dep1', name: 'Department', projectId: '1' }]
        const mockUsers = [
            { _id: 'user1', name: 'Duy', departmentId: 'dep1', technologyId: ['1', '2'] },
            { _id: 'user3', name: 'Duy', departmentId: 'dep1', technologyId: [] }
        ];
        const updateProjectDtoValid = {
            _id: '1',
            name: 'Updated Project',
            userId: ['user1'],
            customerId: '67330aacfdff8b07a967e996'
        };

        it('Should update successfully', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);

            mockProjectModel.findOne.mockResolvedValue(mockProject[0]);
            mockDepartmentsService.findByProjectId.mockResolvedValue([mockDepartments[0]])
            mockUserService.findAllUser.mockResolvedValue(mockUsers);

            const result = await service.update(updateProjectDtoValid, mockAdmin);
            expect(result).toEqual({ message: 'update project successfully' });
            expect(mockProjectModel.updateOne).toHaveBeenCalledWith(
                { _id: updateProjectDtoValid._id },
                { ...updateProjectDtoValid, updatedBy: mockAdmin._id },
                { new: true }
            )
        })
        it('Should throw error when add users to this project before adding the project to the department', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockProjectModel.findOne.mockResolvedValue(mockProject[1]);
            mockDepartmentsService.findByProjectId.mockResolvedValue([])
            const updateProjectDtoInValid = {
                _id: '2',
                name: 'Updated Project',
                userId: ['user1'],
                customerId: '67330aacfdff8b07a967e996'
            };
            await expect(service.update(updateProjectDtoInValid, mockAdmin)).rejects.toThrowError(
                new BadRequestException('You can only add users to this project after adding the project to the department')
            )
        })
        it("Should throw error when employee not contain in manager's department", async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);

            mockProjectModel.findOne.mockResolvedValue(mockProject[0]);
            mockDepartmentsService.findByProjectId.mockResolvedValue([mockDepartments[0]])
            mockUserService.findAllUser.mockResolvedValue(mockUsers);

            const updateProjectDtoInValid = {
                _id: '1',
                name: 'Updated Project',
                userId: ['user2'],
                customerId: '67330aacfdff8b07a967e996'
            };

            await expect(service.update(updateProjectDtoInValid, mockAdmin)).rejects.toThrowError(
                new BadRequestException('User must belong to a department that contains the project')
            )
        })
        it("Should throw error when one of users not have technology", async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);

            mockProjectModel.findOne.mockResolvedValue(mockProject[0]);
            mockDepartmentsService.findByProjectId.mockResolvedValue([mockDepartments[0]])
            mockUserService.findAllUser.mockResolvedValue(mockUsers);
            const updateProjectDtoInValid = {
                _id: '1',
                name: 'Updated Project',
                userId: ['user3'],
                customerId: '67330aacfdff8b07a967e996'
            };
            await expect(service.update(updateProjectDtoInValid, mockAdmin)).rejects.toThrowError(
                new BadRequestException('User must have a technology assigned')
            )
        })
    })
    describe('remove', () => {
        const mockAdmin = {
            _id: 'adminId',
            name: 'Adm',
            email: 'adm@gmail.com',
            roleId: 'roleAdmin',
            roleName: 'Admin',
        }
        const mockProject = [
            { _id: '1', name: 'Project 1', userId: ['empId111', 'empId000'] },
            { _id: '2', name: 'Project 2', userId: ['empId999', 'empId696'] }
        ]
        it('remove successfully', async () => {
            mockProjectRealtionService.checkProjectRelations.mockResolvedValue(false);
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockProjectModel.findOne.mockResolvedValue(mockProject[0]);
            mockProjectModel.updateOne.mockResolvedValue({ nModfied: 1 });
            mockProjectModel.softDelete.mockResolvedValue({});

            const result = await service.remove('1', mockAdmin);

            expect(result.message).toBe("Delete project successfully");
            expect(mockProjectModel.updateOne).toHaveBeenCalledWith(
                { _id: '1' },
                { deletedBy: mockAdmin._id }
            )
            expect(mockProjectModel.softDelete).toHaveBeenCalledWith(
                { _id: '1' }
            )
        })
        it('Throw error when not found project to delete', async () => {
            mockProjectRealtionService.checkProjectRelations.mockResolvedValue(false);
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockProjectModel.findOne.mockResolvedValue(null);
            await expect(service.remove('3', mockAdmin)).rejects.toThrowError(
                new BadRequestException('Not found project')
            )
        })
        it('Throw error when project is linked to other department', async () => {
            mockProjectRealtionService.checkProjectRelations.mockResolvedValue(true);
            await expect(service.remove('1', mockAdmin)).rejects.toThrowError(
                new BadRequestException("Can't remove project because it's linked to department")
            )
        })
    })
})