import mongoose, { Model } from "mongoose";
import { RolesService } from "./roles.service"
import { Role } from "./schema/role.schema";
import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { RoleRelationshipService } from "./role-relationship.service";
import { PaginationService } from "../_shared/paginate/pagination.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { BadRequestException } from "@nestjs/common";
import { UpdateRoleDto } from "./dto/update-role.dto";

describe('RolesService', () => {
    let service: RolesService;
    let rolesModel: Model<Role>;

    const mockRoleModel = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        updateOne: jest.fn(),
        softDelete: jest.fn(),
    }
    const mockRoleRelationshipService = {
        checkRoleRelations: jest.fn().mockResolvedValue(false)
    }
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RolesService,
                {
                    provide: getModelToken(Role.name),
                    useValue: mockRoleModel
                },
                {
                    provide: RoleRelationshipService,
                    useValue: mockRoleRelationshipService
                },
                PaginationService
            ]
        }).compile();
        service = module.get<RolesService>(RolesService);
        rolesModel = module.get<Model<Role>>(getModelToken(Role.name));
    })

    afterEach(() => {
        jest.resetAllMocks();
    })

    describe('create', () => {
        const mockCreateRoleDto: CreateRoleDto = {
            name: 'role1',
            description: 'role11 description',
            permissionId: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'] as any
        }
        const mockUser = { _id: 'user_id' } as any;

        it('Should create role successfully', async () => {
            mockRoleModel.findOne.mockResolvedValue(null);
            mockRoleModel.create.mockResolvedValue(mockCreateRoleDto);
            const result = await service.create(mockCreateRoleDto, mockUser);

            expect(result).toBe('Create role successfully');
            expect(mockRoleModel.create).toHaveBeenCalledWith({ ...mockCreateRoleDto, createdBy: mockUser._id });
        });
        it('Should throw bad request exception when name already exists', async () => {
            mockRoleModel.findOne.mockResolvedValue({ name: 'role1' });

            await expect(service.create(mockCreateRoleDto, mockUser)).rejects.toThrowError(
                new BadRequestException('Role already exists')
            )
        })
    })

    describe('getAll', () => {
        const mockRoles = [
            { _id: '1', name: 'Role1', description: 'des role 1', permissionId: ['1', '2', '3'] },
            { _id: '2', name: 'Role2', description: 'des role 2', permissionId: ['1', '2', '3', '6', '9'] }
        ]
        it('should get all roles successfully', async () => {
            const mockResultRole = {
                meta: {
                    current: 1,
                    pageSize: 10,
                    pages: 1,
                    total: 2
                },
                result: mockRoles
            };
            mockRoleModel.find.mockResolvedValue(mockRoles);
            const result = await service.findAll(1, 10, '');
            expect(result).toStrictEqual(mockResultRole);
            expect(mockRoleModel.find).toHaveBeenCalled();
        })
    })

    describe('findOne', () => {
        const mockRoles = {
            _id: '1',
            name: 'Role1',
            description: 'des role 1',
            permissionId: ['1', '2', '3']
        }
        it('Should return the role successfully', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);

            const mockFindOne = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue(mockRoles) // Mock populate
            });

            mockRoleModel.findOne = mockFindOne;
            const result = await service.findOne(mockRoles._id);
            expect(result).toStrictEqual(mockRoles);
            expect(mockRoleModel.findOne).toHaveBeenCalledWith(
                {
                    _id: mockRoles._id,
                    $or: [
                        { isDeleted: { $exists: false } },
                        { isDeleted: false },
                    ]
                }
            );
            expect(mockFindOne().populate).toHaveBeenCalledWith({
                path: 'permissionId',
                select: '_id apiPath name method module'
            });
        })
        it('Shoud be thrown bad request exception when role not found', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);

            const mockFindOne = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue(null) // Mock populate
            });

            mockRoleModel.findOne = mockFindOne;

            await expect(service.findOne(mockRoles._id)).rejects.toThrowError(
                new BadRequestException("Not found role")
            )
        })
    });

    describe('update', () => {
        const mockUpdateRoleDto: UpdateRoleDto = {
            _id: '1',
            name: 'role1 updated',
            description: 'role11 updated description',
            permissionId: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'] as any
        }
        const mockUser = { _id: 'user_id' } as any;

        it('Should update role successfully', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);

            const mockFindOne = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue(mockUpdateRoleDto) // Mock populate
            });
            mockRoleModel.findOne = mockFindOne;
            const result = await service.update(mockUpdateRoleDto, mockUser);

            expect(result).toBe("Update role successfully");
            expect(mockRoleModel.updateOne).toHaveBeenCalledWith(
                { _id: mockUpdateRoleDto._id },
                { ...mockUpdateRoleDto, updatedBy: mockUser._id }
            )
        })
        it('Should throw bad request exception when role id not found', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);

            const mockFindOne = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue(null) // Mock populate
            });

            mockRoleModel.findOne = mockFindOne;


            await expect(service.update(mockUpdateRoleDto, mockUser)).rejects.toThrowError(
                new BadRequestException('Not found role')
            )
        })
    })

    describe('remove', () => {
        const mockRole = {
            _id: '1',
            name: 'role1 updated',
            description: 'role11 updated description',
            permissionId: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'] as any
        }
        const mockUser = { _id: 'user_id' } as any;
        it('Should remove role successfully', async () => {
            mockRoleRelationshipService.checkRoleRelations.mockResolvedValue(false);
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            const mockFindOne = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue(mockRole) // Mock populate
            });
            mockRoleModel.findOne = mockFindOne;

            mockRoleModel.updateOne.mockResolvedValue({ nModified: 1 });
            mockRoleModel.softDelete.mockResolvedValue({});

            const result = await service.remove(mockRole._id, mockUser);

            expect(result).toBe("Remove role successfully");
            expect(mockRoleModel.softDelete).toHaveBeenCalledWith(
                { _id: mockRole._id }
            )
        })
        it('Should throw bad request exception when object link to another object', async () => {
            mockRoleRelationshipService.checkRoleRelations.mockResolvedValue(true);

            await expect(service.remove(mockRole._id, mockUser)).rejects.toThrowError(
                new BadRequestException("Can't remove role because it's linked to user")
            )
        })
        it('Should throw bad request exception when not found role id to remove', async () => {
            mockRoleRelationshipService.checkRoleRelations.mockResolvedValue(false);
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);

            const mockFindOne = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue(null) // Mock populate
            });
            mockRoleModel.findOne = mockFindOne;

            await expect(service.remove(mockRole._id, mockUser)).rejects.toThrowError(
                new BadRequestException('Not found role')
            )
        })
    })

})