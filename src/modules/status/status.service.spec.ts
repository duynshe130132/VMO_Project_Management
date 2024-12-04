import mongoose, { Model } from "mongoose";
import { Status } from "./schema/status.schema";
import { StatusModule } from "./status.module";
import { StatusService } from "./status.service"
import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { StatusRelationshipService } from "./status-relationship.service";
import { PaginationService } from "../_shared/paginate/pagination.service";
import { CreateStatusDto } from "./dto/create-status.dto";
import { BadRequestException } from "@nestjs/common";
import { UpdateStatusDto } from "./dto/update-status.dto";

describe('StatusService', () => {
    let service: StatusService;
    let statusModel: Model<Status>;

    const mockStatusModel = {
        findOne: jest.fn(),
        find: jest.fn(),
        create: jest.fn(),
        updateOne: jest.fn(),
        softDelete: jest.fn(),
        statusExist: jest.fn()
    }

    const mockStatusRelationship = {
        checkStatusRelations: jest.fn().mockResolvedValue(false)
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StatusService,
                {
                    provide: getModelToken(Status.name),
                    useValue: mockStatusModel
                },
                {
                    provide: StatusRelationshipService,
                    useValue: mockStatusRelationship
                },
                PaginationService
            ]
        }).compile();
        service = module.get<StatusService>(StatusService);
        statusModel = module.get<Model<Status>>(getModelToken(Status.name));
    })
    afterEach(() => {
        jest.resetAllMocks();
    })

    describe('create', () => {
        const mockCreateStatusDto: CreateStatusDto = {
            name: 'Test status 1',
            description: "Description for status 1"
        }
        const mockUser = { _id: "user_123" } as any;
        it('Should be create successfully', async () => {
            mockStatusModel.findOne.mockResolvedValue(false);
            mockStatusModel.create.mockResolvedValue(mockCreateStatusDto);

            const result = await service.create(mockCreateStatusDto, mockUser);
            expect(result).toBe('Create new status successfully');
            expect(mockStatusModel.create).toHaveBeenCalledWith({
                ...mockCreateStatusDto, createdBy: mockUser._id
            })
        });
        it('Should be throw new badrequest because name is existing', async () => {
            mockStatusModel.findOne.mockResolvedValue({ name: 'Test status 1' });
            try {
                await service.create(mockCreateStatusDto, mockUser)
            }
            catch (e) {
                expect(e).toBeInstanceOf(BadRequestException);
                expect(e.response.message).toBe('Status already exists');
            }
        })
    })

    describe('findAll', () => {
        const mockStatus =
            [
                { _id: 'id1', name: 'statusDemo1', description: 'description 1 for status 1' },
                { _id: 'id2', name: 'statusDemo2', description: 'description 2 for status 2' }
            ]
        it('Should be get all status successfully', async () => {
            const mockResult = {
                meta: {
                    current: 1,
                    pageSize: 10,
                    pages: 1,
                    total: 2
                },
                result: mockStatus
            };

            mockStatusModel.find.mockResolvedValue(mockStatus);
            const result = await service.findAll(1, 10, '');
            expect(result).toStrictEqual(mockResult);
            expect(mockStatusModel.find).toHaveBeenCalled();
        })

    })

    describe('findOne', () => {
        const mockStatus = { _id: 'id1', name: 'Test status 1', description: 'description 1 for status 1' };
        it('Should return a status success', async () => {

            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockStatusModel.statusExist.mockResolvedValue(mockStatus);
            mockStatusModel.findOne.mockResolvedValue(mockStatus);

            const result = await service.findOne('id1');
            expect(result).toEqual(mockStatus);
            expect(mockStatusModel.findOne).toHaveBeenCalledWith({
                _id: mockStatus._id,
                $or: [
                    { isDeleted: { $exists: false } },
                    { isDeleted: false },
                ]
            })
        });
        it('should throw badrequest because invalid mongoose.ObjectId', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false);

            await expect(service.findOne('id1')).rejects.toThrowError(
                new BadRequestException('Invalid id mongo')
            )
        })
        it('Show throw badrequest becasue status not found', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockStatusModel.findOne.mockResolvedValue(null);

            await expect(service.findOne('eid')).rejects.toThrowError(
                new BadRequestException('Not found status')
            )
        })
    })

    describe('update', () => {
        const mockUpdateStatusDto: UpdateStatusDto = {
            _id: 'idUpdate1',
            name: 'Update status 1',
            description: "Description for update status 1"
        }
        const mockUser = { _id: "user_123" } as any;

        it('should update status successfully', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockStatusModel.findOne.mockResolvedValue({
                id: mockUpdateStatusDto._id,
                isDeleted: false
            })
            mockStatusModel.updateOne.mockResolvedValue({ nModified: 1 });

            const result = await service.update(mockUpdateStatusDto, mockUser);

            expect(result).toBe('Update status successfully');
            expect(mockStatusModel.updateOne).toHaveBeenCalledWith(
                { _id: mockUpdateStatusDto._id },
                { ...mockUpdateStatusDto, updatedBy: mockUser._id },
                { new: true }
            )
        })
        it('Should throw badrequest exception because status id not found', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockStatusModel.findOne.mockResolvedValue(null);

            await expect(service.update(mockUpdateStatusDto, mockUser)).rejects.toThrowError(
                new BadRequestException('Not found status')
            )
        })
    })
    describe('remove', () => {
        const mockUser = { _id: "user_123" } as any;
        it('should remove successfully', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockStatusModel.findOne.mockResolvedValue({
                _id: 'idRemove',
                isDeleted: false
            })
            mockStatusModel.updateOne.mockResolvedValue({ nModfied: 1 });
            mockStatusModel.softDelete.mockResolvedValue({});

            const result = await service.remove('idRemove', mockUser);

            expect(result).toBe('Delete status successfully')
        })

        it('Should throw badrequest exception when object link to another object', async () => {
            mockStatusRelationship.checkStatusRelations.mockResolvedValue(true);
            await expect(service.remove('idRemove', mockUser)).rejects.toThrowError(
                new BadRequestException("Can't remove status because it's linked to project")
            )
        })

        it('Should throw badrequest exception when not found status to delete', async () => {
            mockStatusRelationship.checkStatusRelations.mockResolvedValue(false);
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockStatusModel.findOne.mockResolvedValue(null);

            await expect(service.remove('idRemove', mockUser)).rejects.toThrowError(
                new BadRequestException('Not found status')
            )
        })
    })
})