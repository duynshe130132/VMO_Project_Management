import { Model } from "mongoose";
import { User } from "./schema/user.schema";
import { UsersService } from "./users.service";
import { getModelToken } from "@nestjs/mongoose";
import { PaginationService } from "../_shared/paginate/pagination.service";
import { UserRelationshipService } from "./user-relationship.service";
import { DepartmentsService } from "../departments/departments.service";
import { ProjectsService } from "../projects/projects.service";
import { AuthService } from "../auth/auth.service";
import { MailerService } from "../_shared/mailer/mailer.service";
import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import mongoose from "mongoose";

describe('UsersService', () => {
    let service: UsersService;
    let userModel: Model<User>;

    const mockUserModel = {
        findOne: jest.fn(),
        find: jest.fn(),
        create: jest.fn(),
        updateOne: jest.fn(),
        softDelete: jest.fn(),
        populate: jest.fn(),
        select: jest.fn(),
    }
    const mockUserRealtionService = {
        checkUserRelations: jest.fn().mockReturnValue(false)
    }
    const mockDepartmentService = {
        findManagerDepartment: jest.fn(),
        isManagerDepartment: jest.fn(),
    }
    const mockDProjectService = {
        findUserByProjectId: jest.fn(),
        isManagerProject: jest.fn(),
        findOne: jest.fn(),
    }
    const mockAuthService = {
        createUserToken: jest.fn(),
        decodeToken: jest.fn(),
    }
    const mockMailerService = {
        sendMail: jest.fn(),
        generateRegisterEmail: jest.fn(),
        generateSendRequestRegister: jest.fn(),
    }
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getModelToken(User.name),
                    useValue: mockUserModel,
                },
                {
                    provide: UserRelationshipService,
                    useValue: mockUserRealtionService,
                },
                {
                    provide: DepartmentsService,
                    useValue: mockDepartmentService,
                },
                {
                    provide: ProjectsService,
                    useValue: mockDProjectService,
                },
                {
                    provide: AuthService,
                    useValue: mockAuthService,
                },
                {
                    provide: MailerService,
                    useValue: mockMailerService,
                },
                ConfigService,
                PaginationService,
            ]
        }).compile();
        service = module.get<UsersService>(UsersService);
        userModel = module.get<Model<User>>(getModelToken(User.name));
    })
    afterEach(() => {
        jest.resetAllMocks();
    })

    describe('register', () => {
        const mockAdmin = {
            _id: 'adminId', name: 'adm', email: 'adm@gmail.com', roleId: 'roleAdmin', roleName: 'Admin'
        }
        const mockCreateDto = {
            name: 'nguyen van user',
            email: 'user@gmail.com',
            dateOfBirth: new Date(2000, 1, 1),
            address: 'Ha Noi',
            cccd: '001099019616',
            phone: '0373985863',
            technologyId: ['1', '2'],
            roleId: 'roleEmployee',
            yearExp: 2,
            language: ['vi', 'en'],
            departmentId: ['dep1']
        }
        it('Shoud create user successfully', async () => {
            mockUserModel.findOne.mockImplementationOnce(() => Promise.resolve(null));

            const mockNewUser = {
                ...mockCreateDto,
                _id: 'newUserId',
                createdBy: mockAdmin._id,
                save: jest.fn().mockResolvedValue(true)
            }
            mockUserModel.create.mockResolvedValue(mockNewUser);
            mockUserModel.findOne.mockResolvedValue(mockNewUser);

            const password = 'temporaryPassword123'; // Giả lập mật khẩu tạm thời
            jest.spyOn(service, 'generateRandomPassword').mockReturnValue(password);
            const mailOptions = {
                to: mockCreateDto.email,
                subject: 'Account Created',
                html: `
                    <p>Your account has been created successfully.</p>
                    <p>Here is your username: <strong>${mockNewUser.email}</strong></p>
                    <p>Here is your temporary password: <strong>${password}</strong></p>
                    <p>Please click on the link below to change your password:</p>
                `,
            };
            // Giả lập generateRegisterEmail
            jest.spyOn(mockMailerService, 'generateRegisterEmail').mockReturnValue(mailOptions);

            jest.spyOn(mockMailerService, 'sendMail').mockResolvedValue(true);
            const result = await service.register(mockCreateDto, mockAdmin);
            expect(result).toBe('Register successfully !');
            expect(mockMailerService.sendMail).toHaveBeenCalledWith(mailOptions);
        })
        it('Should  throw error when email already exists', async () => {
            mockUserModel.findOne.mockResolvedValue({ email: "duy12111999@gmail.com" });
            await expect(service.register(mockCreateDto, mockAdmin)).rejects.toThrowError(
                new BadRequestException('Email already exists')
            )
        })
    })
    describe('SendRequestCreateUser', () => {
        const mockAdmin = {
            _id: 'adminId', name: 'adm', email: 'adm@gmail.com', roleId: 'roleAdmin', roleName: 'Admin'
        }
        const mockManager = {
            _id: 'managerId',
            name: 'Nng',
            email: 'nng@gmail.com',
            roleId: { _id: 'roleManager', name: 'Manager' },
            roleName: 'Manager'
        }
        const mockCreateDto = {
            name: 'nguyen van user',
            email: 'user@gmail.com',
            dateOfBirth: new Date(2000, 1, 1),
            address: 'Ha Noi',
            cccd: '001099019616',
            phone: '0373985863',
            technologyId: ['1', '2'],
            roleId: '673308e8361cf574b01a19cc',
            yearExp: 2,
            language: ['vi', 'en'],
            departmentId: ['dep1']
        }
        const mockDepartments = [
            { _id: 'dep1', name: 'Department1', user_managerId: 'managerId' }
        ]
        it('Should send request successfully', async () => {
            const token = 'DemoToken';
            mockDepartmentService.findManagerDepartment.mockResolvedValue([mockDepartments[0]]);
            mockAuthService.createUserToken.mockResolvedValue(token);

            const resetPasswordLink = `http://your-actual-domain.com/reset-password?token=${token}`;
            const mailOptions = {
                to: mockAdmin.email,
                subject: 'New User Registration Request',
                html: `
                   <p>A new user has requested to be registered. Please review the request.</p>
              <p>Click the link below to review the registration:</p>
              <p><a href="${resetPasswordLink}">Create new user</a></p>
              <p>If you want to reject, you can simply ignore this email.</p>
                `,
            };
            jest.spyOn(mockMailerService, 'generateSendRequestRegister').mockReturnValue(mailOptions);
            jest.spyOn(mockMailerService, 'sendMail').mockResolvedValue(true);
            const result = await service.sendRequestCreateForAdmin(mockAdmin, mockCreateDto);
            expect(result.message).toBe('Send request successfully');
            expect(mockMailerService.sendMail).toHaveBeenCalledWith(mailOptions);
        })
        it('Should throw error when members outside your department', async () => {
            const mockCreateDtoInvalid = {
                name: 'nguyen van user',
                email: 'user@gmail.com',
                dateOfBirth: new Date(2000, 1, 1),
                address: 'Ha Noi',
                cccd: '001099019616',
                phone: '0373985863',
                technologyId: ['1', '2'],
                roleId: '673308e8361cf574b01a19cc',
                yearExp: 2,
                language: ['vi', 'en'],
                departmentId: ['dep2']
            }
            mockDepartmentService.findManagerDepartment.mockResolvedValue([mockDepartments[0]]);
            await expect(service.sendRequestCreateForAdmin(mockAdmin, mockCreateDtoInvalid)).rejects.toThrowError(
                new BadRequestException("You can't send request create new members outside your department")
            )
        })
    })
    describe('previewRequestCreateForAdmin', () => {
        it('Should preview successfully', async () => {
            const token = 'mytoken';
            const mockDecode = "decodeathere";
            mockAuthService.decodeToken.mockResolvedValue(mockDecode);
            const mockReturnSesult = {
                success: true,
                data: mockDecode
            }
            const result = await service.preview_requestCreateUser(token);
            expect(result).toStrictEqual(mockReturnSesult);
        })
        it('Should throw error when token is expired', async () => {
            const token = 'mytoken';
            mockAuthService.decodeToken.mockRejectedValue(new Error('Invalid token'));
            await expect(service.preview_requestCreateUser(token)).rejects.toThrow(BadRequestException);
            await expect(service.preview_requestCreateUser(token)).rejects.toThrow('Invalid or expired token');
        })
    })
    describe('acceptRequestCreateUser', () => {
        const mockAdmin = {
            _id: 'adminId', name: 'adm', email: 'adm@gmail.com', roleId: 'roleAdmin', roleName: 'Admin'
        }
        it('Should accept successful request', async () => {
            const token = 'mytoken';
            const mockDecode = "decodeathere";

            mockAuthService.decodeToken.mockResolvedValue(mockDecode);

            jest.spyOn(service, 'register').mockResolvedValue('Register successfully !');
            const result = await service.acceptRequestCreateUser(token, mockAdmin);

            expect(result).toStrictEqual({ success: true, message: 'User created successfully.' });
            expect(mockAuthService.decodeToken).toHaveBeenCalledWith(token);
            expect(service.register).toHaveBeenCalledWith(mockDecode, mockAdmin);
        })
        it('Should throw error when token is expired', async () => {
            const token = 'mytoken';
            mockAuthService.decodeToken.mockRejectedValue(new Error('Invalid token'));
            await expect(service.acceptRequestCreateUser(token, mockAdmin)).rejects.toThrow(BadRequestException);
            await expect(service.acceptRequestCreateUser(token, mockAdmin)).rejects.toThrow('Invalid or expired token');
        })
    })

    describe('GetProfile', () => {
        const mockIUser = {
            _id: '67330aacfdff8b07a967e996', name: 'adm', email: 'adm@gmail.com', roleId: '673308d7361cf574b01a19c9', roleName: 'Manager'
        }
        const mockUserDemo = {
            _id: 'userId',
            name: 'adm',
            email: 'adm@gmail.com',
            dateOfBirth: new Date(2000, 1, 1),
            address: 'Ha Noi',
            cccd: '001099019616',
            phone: '0373985863',
            technologyId: ['1', '2'],
            roleId: { _id: '673308d7361cf574b01a19c9', name: 'Manager' },
            yearExp: 2,
            language: ['vi', 'en'],
            departmentId: ['dep1'],
        }
        it('Should get profile successfully', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);

            mockUserModel.findOne.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue(mockUserDemo), // Trả về mockUser từ select
                }),
            });
            const result = await service.handleGetProfile(mockIUser);

            expect(result).toStrictEqual(mockUserDemo);
            expect(mockUserModel.findOne).toHaveBeenCalledWith({ _id: mockIUser._id });
            expect(mockUserModel.findOne().populate).toHaveBeenCalledWith({ path: 'roleId', select: 'name' });
            expect(mockUserModel.findOne().populate().select).toHaveBeenCalledWith('-password -refreshToken');
        })
    })
    describe('findAll', () => {
        const mockUsers = [
            { _id: 'user1', name: 'userFirst' },
            { _id: 'user2', name: 'userSecond' }
        ]
        it('Should list all employees', async () => {
            const mockPagination = {
                meta: {
                    current: 1,
                    pageSize: 10,
                    pages: 1,
                    total: 2
                },
                result: mockUsers
            }
            mockUserModel.find.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUsers)
            })
            const results = await service.findAll(1, 10, '');
            expect(results).toStrictEqual(mockPagination);
            expect(mockUserModel.find).toHaveBeenCalled();
            expect(mockUserModel.find().select).toHaveBeenCalledWith('-password -refreshToken')
        })
    })
    describe('getUserById', () => {
        const mockAdmin = {
            _id: 'adminId', name: 'adm', email: 'adm@gmail.com', roleId: 'roleAdmin', roleName: 'Admin'
        }
        const mockManager = {
            _id: 'managerId', name: 'mng', email: 'mng@gmail.com', roleId: 'roleManager', roleName: 'Manager'
        }
        const mockDepartment = [{
            _id: 'dep1', user_managerId: 'managerId'
        }]
        const mockUsers = [
            { _id: 'user1', name: 'James', departmentId: [] },
            { _id: 'user2', name: 'Scolt', departmentId: ['dep1'] }
        ]
        it('Should return any user by id when role is Admin', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockUserModel.findOne.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue(mockUsers[0]),
                })
            })
            const result = await service.getUserById('user1', mockAdmin);
            expect(result).toStrictEqual(mockUsers[0]);
            expect(mockUserModel.findOne).toHaveBeenCalledWith({ _id: 'user1' });
            expect(mockUserModel.findOne().populate).toHaveBeenCalledWith({ path: 'roleId', select: 'name' });
            expect(mockUserModel.findOne().populate().select).toHaveBeenCalledWith('-password -refreshToken');
        })
        it('Should return user in manager department when role is Manager', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);

            mockUserModel.findOne.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue(mockUsers[1]),
                }),
            });

            mockDepartmentService.findManagerDepartment.mockResolvedValue([mockDepartment[0]]);
            const result = await service.getUserById('user2', mockManager);
            expect(result).toStrictEqual(mockUsers[1]);
        })
        it('Should throw error when User is not available for this manager department', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockUserModel.findOne.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue(mockUsers[0]),
                }),
            });
            mockDepartmentService.findManagerDepartment.mockResolvedValue([mockDepartment[0]]);
            await expect(service.getUserById('user2', mockManager)).rejects.toThrowError(
                new BadRequestException('User is not available for this manager department')
            )
        })
    })
    describe('findAllByRole', () => {
        const mockUsers = [
            { _id: 'user1', name: 'James', roleId: 'roleEmployee' },
            { _id: 'user2', name: 'Scolt', roleId: 'roleManager' }
        ]
        it('Should return list users by roleId', async () => {
            const mockByRoleMng = [mockUsers[1]]
            const mockPagination = {
                meta: {
                    current: 1,
                    pageSize: 10,
                    pages: 1,
                    total: 1
                },
                result: mockByRoleMng
            }
            mockUserModel.find.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockByRoleMng)
            })
            const results = await service.findAllByRole('roleManager', 1, 10, '');
            expect(results).toStrictEqual(mockPagination);
            expect(mockUserModel.find).toHaveBeenCalledWith({ roleId: 'roleManager' });
            expect(mockUserModel.find().select).toHaveBeenCalledWith('-password -refreshToken');
        })
    })
    describe('findAllByDepartmentId', () => {
        const mockAdmin = {
            _id: 'adminId', name: 'adm', email: 'adm@gmail.com', roleId: 'roleAdmin', roleName: 'Admin'
        }
        const mockManager = {
            _id: 'managerId', name: 'mng', email: 'mng@gmail.com', roleId: 'roleManager', roleName: 'Manager'
        }
        const mockEmployee = {
            _id: 'employeeId', name: 'emp', email: 'emp@gmail.com', roleId: 'roleEmployee', roleName: 'Employee'
        }
        const mockDepartments = [
            { _id: 'dep1', user_managerId: 'managerId' },
            { _id: 'dep2', user_managerId: 'managerId1' }
        ]
        const mockUsers = [
            { _id: 'user1', name: 'James', departmentId: ['dep1'] },
            { _id: 'user2', name: 'Scolt', departmentId: ['dep2'] },
            { _id: 'employeeId', name: 'Ali', departmentId: ['dep3'] },
            { _id: 'user3', name: 'Baba', departmentId: ['dep3'] }
        ]
        it('Should show users in any department when role is Admin', async () => {
            const mockResult = [mockUsers[1]];
            const mockPagination = {
                meta: {
                    current: 1,
                    pageSize: 10,
                    pages: 1,
                    total: 1
                },
                result: mockResult
            }
            mockUserModel.find.mockResolvedValue(mockUsers)
            const results = await service.findAllByDepartmentId(mockAdmin, 'dep2', 1, 10, '');

            expect(results).toStrictEqual(mockPagination)
        })
        it('Should show users in manager department when role is Manager', async () => {
            mockDepartmentService.isManagerDepartment.mockResolvedValue(true);
            const mockResult = [mockUsers[0]];
            const mockPagination = {
                meta: {
                    current: 1,
                    pageSize: 10,
                    pages: 1,
                    total: 1
                },
                result: mockResult
            }
            mockUserModel.find.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUsers)
            })
            const results = await service.findAllByDepartmentId(mockManager, 'dep1', 1, 10, '');

            console.log("Check results: ", results);

            expect(results).toStrictEqual(mockPagination)
        })
        it('Should throw error for manager role when department not belong to manager', async () => {
            mockDepartmentService.isManagerDepartment.mockResolvedValue(false);
            await expect(service.findAllByDepartmentId(mockManager, 'dep2', 1, 10, '')).rejects.toThrowError(
                new BadRequestException('Department are not available for this user')
            )
        })
        it('Should show team members when role is Employee', async () => {
            const mockResults = [mockUsers[2], mockUsers[3]];
            const mockPagination = {
                meta: {
                    current: 1,
                    pageSize: 10,
                    pages: 1,
                    total: 2
                },
                result: mockResults
            }
            mockUserModel.find.mockResolvedValue(mockUsers);
            mockUserModel.findOne.mockResolvedValue(mockUsers[2]);
            const result = await service.findAllByDepartmentId(mockEmployee, 'dep3', 1, 10, '');
            expect(result).toStrictEqual(mockPagination)
        })
        it('Should throw error when department is not belong to employee', async () => {
            mockUserModel.find.mockResolvedValue(mockUsers);
            mockUserModel.findOne.mockResolvedValue(mockUsers[2]);
            await expect(service.findAllByDepartmentId(mockEmployee, 'dep2', 1, 10, '')).rejects.toThrowError(
                new BadRequestException('Department is not available for user')
            )
        })
    })
    describe('listAllUserByProjectId', () => {
        const mockAdmin = {
            _id: 'adminId', name: 'adm', email: 'adm@gmail.com', roleId: 'roleAdmin', roleName: 'Admin'
        }
        const mockManager = {
            _id: 'managerId', name: 'mng', email: 'mng@gmail.com', roleId: 'roleManager', roleName: 'Manager'
        }
        const mockEmployee = {
            _id: 'employeeId', name: 'emp', email: 'emp@gmail.com', roleId: 'roleEmployee', roleName: 'Employee'
        }
        const mockDepartments = [
            { _id: 'dep1', user_managerId: 'managerId', projectId: ['p1'] },
            { _id: 'dep2', user_managerId: 'managerId1', projectId: ['p2'] },
        ]
        const mockProjects = [
            { _id: 'p1', userId: ['user1', 'user2'] },
            { _id: 'p2', userId: ['employeeId', 'user3'] },
        ]
        const mockUsers = [
            { _id: 'user1', name: 'James', departmentId: ['dep1'] },
            { _id: 'user2', name: 'Scolt', departmentId: ['dep2'] },
            { _id: 'employeeId', name: 'Ali', departmentId: ['dep3'] },
            { _id: 'user3', name: 'Baba', departmentId: ['dep3'] }
        ]
        it('Should return users by any project when role is Admin', async () => {
            const mockPagination = {
                meta: {
                    current: 1,
                    pageSize: 10,
                    pages: 1,
                    total: 2
                },
                result: [mockUsers[0], mockUsers[1]]
            }
            mockDProjectService.findUserByProjectId.mockResolvedValue(['user1', 'user2']);
            mockUserModel.find.mockReturnValue({
                select: jest.fn().mockResolvedValue([mockUsers[0], mockUsers[1]]) // Trả về danh sách người dùng đã lọc
            });

            const results = await service.listAllUserByProjectId('p1', mockAdmin, 1, 10, '');
            expect(results).toStrictEqual(mockPagination);
        })
        it('Should return users in manager project when role is Manager', async () => {
            const mockPagination = {
                meta: {
                    current: 1,
                    pageSize: 10,
                    pages: 1,
                    total: 2
                },
                result: [mockUsers[0], mockUsers[1]]
            }
            mockDProjectService.isManagerProject.mockResolvedValue(true);
            mockDProjectService.findUserByProjectId.mockResolvedValue(['user1', 'user2']);
            mockUserModel.find.mockReturnValue({
                select: jest.fn().mockResolvedValue([mockUsers[0], mockUsers[1]]),
            })
            const result = await service.listAllUserByProjectId('p1', mockManager, 1, 10, '');
            expect(result).toStrictEqual(mockPagination);
        })
        it('Should throw error when project is not available for Manager', async () => {
            mockDProjectService.isManagerProject.mockResolvedValue(false);
            await expect(service.listAllUserByProjectId('p2', mockManager, 1, 10, '')).rejects.toThrowError(
                new BadRequestException('Project are not available for this user')
            )
        })
        it('Should return team members when role is Employee', async () => {
            const mockPagination = {
                meta: {
                    current: 1,
                    pageSize: 10,
                    pages: 1,
                    total: 2
                },
                result: [mockUsers[2], mockUsers[3]]
            }
            mockDProjectService.findOne.mockResolvedValue(mockProjects[1]);
            mockUserModel.find.mockReturnValue({
                select: jest.fn().mockResolvedValue([mockUsers[2], mockUsers[3]]),
            })
            const results = await service.listAllUserByProjectId('p2', mockEmployee, 1, 10, '');
            expect(results).toStrictEqual(mockPagination)
        })
        it('Should throw error when project is not available for this user', async () => {
            mockDProjectService.findOne.mockResolvedValue(mockProjects[0]);
            await expect(service.listAllUserByProjectId('p1', mockEmployee, 1, 10, '')).rejects.toThrowError(
                new BadRequestException('Project is not available for this user')
            )

        })
    })
    describe('Update', () => {
        const mockUser = { _id: 'user1', name: 'James Scolt' };
        const mockAdmin = {
            _id: 'adminId', name: 'adm', email: 'adm@gmail.com', roleId: 'roleAdmin', roleName: 'Admin'
        }
        const mockUpdateDto = {
            _id: 'user1',
            name: 'Alibaba'
        }
        it('Should update successfully', async () => {
            mockUserModel.findOne.mockResolvedValue(mockUser);

            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockUserModel.updateOne({ nModified: 1 });
            const result = await service.update(mockUpdateDto);
            expect(result).toBe('Update successfully');
            expect(mockUserModel.updateOne).toHaveBeenCalledWith(
                { _id: mockUpdateDto._id }, { ...mockUpdateDto }, { new: true }
            )
        })
    })
    describe('remove', () => {
        const mockUser = { _id: 'user1', name: 'James Scolt' };
        it('Should remove successfully', async () => {
            mockUserRealtionService.checkUserRelations.mockResolvedValue(false);
            mockUserModel.softDelete(true);

            const result = await service.remove('user1');
            expect(result).toBe('Delete user successfully');
            expect(mockUserModel.softDelete).toHaveBeenCalledWith({ _id: 'user1' });
        })
        it('Should throw error when user is linked to another object', async () => {
            mockUserRealtionService.checkUserRelations.mockResolvedValue(true);
            await expect(service.remove('user1')).rejects.toThrowError(
                new BadRequestException('Cannot delete user with existing relations')
            )
        })
    })
})