import mongoose, { Model } from "mongoose";
import { ProjecttypesService } from "./projecttypes.service"
import { Projecttype } from "./schema/projecttype.schema";
import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken, MongooseModule } from "@nestjs/mongoose";
import { TypeRelationshipService } from "./type-relationship.service";
import { PaginationService } from "../_shared/paginate/pagination.service";
import { CreateProjecttypeDto } from "./dto/create-projecttype.dto";
import { BadGatewayException, BadRequestException } from "@nestjs/common";
import { UpdateProjecttypeDto } from "./dto/update-projecttype.dto";

describe('ProjecttypesService', () => {
    let service: ProjecttypesService;
    let typeModel = Model<Projecttype>;

    const mockTypeModel = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        updateOne: jest.fn(),
        softDelete: jest.fn(),
    }
    const mockTypeRelationshipService = {
        checkProjectRelations: jest.fn().mockResolvedValue(false)
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProjecttypesService,
                {
                    provide: getModelToken(Projecttype.name),
                    useValue: mockTypeModel
                },
                {
                    provide: TypeRelationshipService,
                    useValue: mockTypeRelationshipService
                },
                PaginationService
            ],
        }).compile();
        service = module.get<ProjecttypesService>(ProjecttypesService);
        typeModel = module.get<Model<Projecttype>>(getModelToken(Projecttype.name));
    })

    afterEach(() => {
        jest.resetAllMocks();
    })

    describe('create', () => {
        const mockCreateTypeDto: CreateProjecttypeDto = {
            name: 'Test type 1',
            description: "Description for type 1"
        }
        const mockUser = { _id: "user_123" } as any;

        it('Should create type successfully', async () => {
            mockTypeModel.findOne.mockResolvedValue(false);
            mockTypeModel.create.mockResolvedValue(mockCreateTypeDto);
            const result = await service.create(mockCreateTypeDto, mockUser);

            expect(result).toBe("Create project type successfully");
            expect(mockTypeModel.create).toHaveBeenCalledWith(
                { ...mockCreateTypeDto, createdBy: mockUser._id }
            )
        })
        it('Should throw bad request exception when name already exists', async () => {
            mockTypeModel.findOne.mockResolvedValue({ name: 'Test type 1' });

            try {
                await service.create(mockCreateTypeDto, mockUser)
            }
            catch (e) {
                expect(e).toBeInstanceOf(BadRequestException);
                expect(e.response.message).toBe("Project type is already exist!")
            }
        })
    })

    describe('findAll', () => {
        const mockProjectTypes = [
            { _id: '1', name: 'type1', description: 'type1 description' },
            { _id: '2', name: 'type2', description: 'type2 description' },
        ]
        it('Should return list types successfully', async () => {
            const mockResultType = {
                meta: {
                    current: 1,
                    pageSize: 10,
                    pages: 1,
                    total: 2
                },
                result: mockProjectTypes
            }

            mockTypeModel.find.mockResolvedValue(mockProjectTypes);
            const result = await service.findAll(1, 10, '');

            expect(result).toStrictEqual(mockResultType);
            expect(mockTypeModel.find).toHaveBeenCalled();
        })
    })

    describe('findOne', () => {
        const mockProjectType = { _id: '1', name: 'type1', description: 'type1 description' }
        it('Should return project type successfullt', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockTypeModel.findOne.mockResolvedValue(mockProjectType);

            const result = await service.findOne(mockProjectType._id);

            expect(result).toStrictEqual(mockProjectType);
            expect(mockTypeModel.findOne).toHaveBeenCalledWith(
                {
                    _id: mockProjectType._id,
                    $or: [
                        { isDeleted: { $exists: false } },
                        { isDeleted: false },
                    ],
                }
            )
        })
        it('Should throw exception when type id not found', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockTypeModel.findOne.mockResolvedValue(null);

            await expect(service.findOne(mockProjectType._id)).rejects.toThrowError(
                new BadRequestException("Not found project type")
            )
        })
    })
    describe('update', () => {
        const mockUpdatetypeDto: UpdateProjecttypeDto = {
            _id: '1',
            name: 'Updated type 1',
            description: "Updated description for type 1"
        }
        const mockUser = { _id: "user_123" } as any;
        it('should update project type successfully', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockTypeModel.findOne.mockResolvedValue(mockUpdatetypeDto);
            mockTypeModel.updateOne(mockUpdatetypeDto);

            const result = await service.update(mockUpdatetypeDto, mockUser);

            expect(result).toBe("Update project type successfully");
            expect(mockTypeModel.updateOne).toHaveBeenCalledWith(
                { _id: mockUpdatetypeDto._id },
                { ...mockUpdatetypeDto, updatedBy: mockUser._id }
            )
            expect(mockTypeModel.findOne).toHaveBeenCalledWith(
                {
                    _id: mockUpdatetypeDto._id,
                    $or: [
                        { isDeleted: { $exists: false } },
                        { isDeleted: false },
                    ],
                }
            )
        })
        it('should throw exception when type id not found to update', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockTypeModel.findOne.mockResolvedValue(null);

            await expect(service.update(mockUpdatetypeDto, mockUser)).rejects.toThrowError(
                new BadRequestException("Not found project type")
            )
        })
    })

    describe('remove', () => {
        const mockType = {
            _id: '1',
            name: 'Updated type 1',
            description: "Updated description for type 1"
        }
        const mockUser = { _id: "user_123" } as any;
        it('should remove type successfully', async () => {
            mockTypeRelationshipService.checkProjectRelations.mockResolvedValue(false);
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockTypeModel.findOne.mockResolvedValue(mockUser);
            mockTypeModel.updateOne.mockResolvedValue({ nModified: 1 });
            mockTypeModel.softDelete.mockResolvedValue({});

            const result = await service.remove(mockType._id, mockUser);

            expect(result).toBe("Remove project type successfully");
            expect(mockTypeModel.findOne).toHaveBeenCalledWith(
                {
                    _id: mockType._id,
                    $or: [
                        { isDeleted: { $exists: false } },
                        { isDeleted: false },
                    ],
                }
            )
            expect(mockTypeModel.updateOne).toHaveBeenCalledWith(
                { _id: mockType._id }, { deletedBy: mockUser._id }
            )
            expect(mockTypeModel.softDelete).toHaveBeenCalledWith(
                { _id: mockType._id }
            )
        })

        it('should throw exception when object is linked to another object', async () => {
            mockTypeRelationshipService.checkProjectRelations.mockResolvedValue(true);

            await expect(service.remove(mockType._id, mockUser)).rejects.toThrowError(
                new BadRequestException("Can't remove type because it's linked to project")
            )
        })
        it('should throw exception when type id not found to remove', async () => {
            mockTypeRelationshipService.checkProjectRelations.mockResolvedValue(false);
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockTypeModel.findOne.mockResolvedValue(null);

            await expect(service.remove(mockType._id, mockUser)).rejects.toThrowError(
                new BadRequestException("Not found project type")
            )
        })
    })
})