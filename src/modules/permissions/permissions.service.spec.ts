import mongoose, { Model } from "mongoose";
import { PermissionsService } from "./permissions.service";
import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { Permission } from "./schema/permission.schema";
import { PermissionRelationshipService } from "./permission-relationship.service";
import { PaginationService } from "../_shared/paginate/pagination.service";
import { CreatePermissionDto } from "./dto/create-permission.dto";
import { BadRequestException } from "@nestjs/common";
import { UpdatePermissionDto } from "./dto/update-permission.dto";

describe('PermissionsService', () => {
    let service: PermissionsService;
    let permisisonModel: Model<Permission>;

    const mockPermissionModel = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        updateOne: jest.fn(),
        softDelete: jest.fn(),
    }
    const mockPermissionRelationService = {
        checkPermissionRelations: jest.fn().mockResolvedValue(false)
    }
    beforeEach(async () => {
        const model: TestingModule = await Test.createTestingModule({
            providers: [
                PermissionsService,
                {
                    provide: getModelToken(Permission.name),
                    useValue: mockPermissionModel,
                },
                {
                    provide: PermissionRelationshipService,
                    useValue: mockPermissionRelationService,
                },
                PaginationService
            ]
        }).compile();

        service = model.get<PermissionsService>(PermissionsService);
        permisisonModel = model.get<Model<Permission>>(getModelToken(Permission.name));
    })
    afterEach(() => {
        jest.resetAllMocks();
    })

    describe('create', () => {
        const mockCreatePermissionDto: CreatePermissionDto = {
            name: 'Test permission',
            apiPath: '/api/v1/test',
            method: 'GET',
            module: 'Test',
        }
        const mockUser = { _id: 'id123' } as any;

        it('Should create permission successfully', async () => {
            mockPermissionModel.findOne.mockResolvedValue(null);
            mockPermissionModel.create.mockResolvedValue(mockCreatePermissionDto);

            const result = await service.create(mockCreatePermissionDto, mockUser);
            expect(result).toBe("Create permission successfully");
            expect(mockPermissionModel.create).toHaveBeenCalledWith(
                { ...mockCreatePermissionDto, createdBy: mockUser._id }
            )
            expect(mockPermissionModel.findOne).toHaveBeenCalledWith(
                { apiPath: mockCreatePermissionDto.apiPath, method: mockCreatePermissionDto.method }
            )
        })
        it('Should throw bad exception when apiPath and method already exist', async () => {
            mockPermissionModel.findOne.mockResolvedValue(mockCreatePermissionDto);
            try {
                await service.create(mockCreatePermissionDto, mockUser)
            }
            catch (e) {
                expect(e).toBeInstanceOf(BadRequestException);
                expect(e.response.message).toBe(`permission apiPath=${mockCreatePermissionDto.apiPath} method=${mockCreatePermissionDto.method} already exists`)
            }
        })
    });

    describe('findAll', () => {
        const mockPermissions = [
            { _id: 'perm_1', name: 'Permission 1', apiPath: '/api/v1/test', method: 'GET', module: 'Test' },
            { _id: 'perm_2', name: 'Permission 2', apiPath: '/api/v1/test', method: 'POST', module: 'Test' }
        ]
        it('Should get list permissions successfully', async () => {
            const mockResultPermission = {
                meta: {
                    current: 1,
                    pageSize: 10,
                    pages: 1,
                    total: 2
                },
                result: mockPermissions
            }

            mockPermissionModel.find.mockResolvedValue(mockPermissions);
            const result = await service.findAll(1, 10, '');
            expect(result).toStrictEqual(mockResultPermission);
            expect(mockPermissionModel.find).toHaveBeenCalled();
        })
    })
    describe('findOne', () => {
        const mockPermission = { _id: 'perm_1', name: 'Permission 1', apiPath: '/api/v1/test', method: 'GET', module: 'Test' }
        it('should return permission successfully', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockPermissionModel.findOne.mockResolvedValue(mockPermission);

            const result = await service.findOne(mockPermission._id);

            expect(result).toStrictEqual(mockPermission);
            expect(mockPermissionModel.findOne).toHaveBeenCalledWith(
                {
                    _id: mockPermission._id,
                    $or: [
                        { isDeleted: { $exists: false } },
                        { isDeleted: false },
                    ]
                }
            )
        })
        it('should throw exception when not found permission id', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockPermissionModel.findOne.mockResolvedValue(null);

            await expect(service.findOne(mockPermission._id)).rejects.toThrowError(
                new BadRequestException("Not found permission")
            )
        })
    })

    describe('update', () => {
        const mockUpdatePermission: UpdatePermissionDto = {
            _id: 'perm_1', name: 'Permission 1', apiPath: '/api/v1/test', method: 'GET', module: 'Test'
        }
        const mockUser = { _id: 'id123' } as any;

        it('Should update permission successfully', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockPermissionModel.findOne.mockResolvedValue(mockUpdatePermission);
            mockPermissionModel.updateOne.mockResolvedValue({ nModified: 1 });
            const result = await service.update(mockUpdatePermission, mockUser);

            expect(result).toBe("Update permission successfully");
            expect(mockPermissionModel.findOne).toHaveBeenCalledWith(
                {
                    _id: mockUpdatePermission._id,
                    $or: [
                        { isDeleted: { $exists: false } },
                        { isDeleted: false },
                    ]
                }
            )
            expect(mockPermissionModel.updateOne).toHaveBeenCalledWith(
                { _id: mockUpdatePermission._id },
                { ...mockUpdatePermission, updatedBy: mockUser._id },
                { new: true }
            )
        })
        it('Should throw exception when id permission not found', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockPermissionModel.findOne.mockResolvedValue(null);
            try {
                await service.update(mockUpdatePermission, mockUser);
            }
            catch (e) {
                expect(e).toBeInstanceOf(BadRequestException);
                expect(e.response.message).toBe("Not found permission")
            }
        })
    })

    describe('remove', () => {
        const mockPermission: UpdatePermissionDto = {
            _id: 'perm_1', name: 'Permission 1', apiPath: '/api/v1/test', method: 'GET', module: 'Test'
        }
        const mockUser = { _id: 'id123' } as any;
        it('Should remove the permission successfully', async () => {
            mockPermissionRelationService.checkPermissionRelations.mockResolvedValue(false);

            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockPermissionModel.findOne.mockResolvedValue(mockPermission);
            mockPermissionModel.updateOne.mockResolvedValue({ nModified: 1 });
            mockPermissionModel.softDelete.mockResolvedValue({});

            const result = await service.remove(mockPermission._id, mockUser);
            expect(result).toBe("Delete permission successfully");
            expect(mockPermissionModel.findOne).toHaveBeenCalledWith(
                {
                    _id: mockPermission._id,
                    $or: [
                        { isDeleted: { $exists: false } },
                        { isDeleted: false },
                    ]
                }
            )
            expect(mockPermissionModel.updateOne).toHaveBeenCalledWith(
                { _id: mockPermission._id },
                { deletedBy: mockUser._id }
            )
            expect(mockPermissionModel.softDelete).toHaveBeenCalledWith(
                { _id: mockPermission._id }
            )
        })

        it('should throw exception when object is linked to another object', async () => {
            mockPermissionRelationService.checkPermissionRelations.mockResolvedValue(true);
            await expect(service.remove(mockPermission._id, mockUser)).rejects.toThrowError(
                new BadRequestException("Can't remove permission because it's linked to role")
            )
        })
        it('should throw exception when permission id not found to delete', async () => {
            mockPermissionRelationService.checkPermissionRelations.mockResolvedValue(false);
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockPermissionModel.findOne.mockResolvedValue(null);
            try {
                await service.remove(mockPermission._id, mockUser);
            }
            catch (e) {
                expect(e).toBeInstanceOf(BadRequestException);
                expect(e.response.message).toBe("Not found permission")
            }

        })
    })
})