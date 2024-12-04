import mongoose, { Model } from "mongoose";
import { Technology } from "./schema/technology.schema";
import { TechnologiesService } from "./technologies.service"
import { CreateTechnologyDto } from "./dto/create-technology.dto";
import { getModelToken } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { TechnologyRelationshipService } from "./technology-relationship.service";
import { PaginationService } from "../_shared/paginate/pagination.service";
import { UpdateTechnologyDto } from "./dto/update-technology.dto";

describe('TechnologiesService', () => {
    let service: TechnologiesService;
    let technologiesModel: Model<Technology>;

    const mockTechnologiesModel = {
        findOne: jest.fn(), //jest.fn() giả lập các phương thức từ service
        create: jest.fn(),
        findAll: jest.fn(),
        updateOne: jest.fn(),
        remove: jest.fn(),
        technologyExist: jest.fn(),
        find: jest.fn(),
        softDelete: jest.fn()
    };

    const mockCreateTechnologyDto: CreateTechnologyDto = {
        name: 'Technology 1',
        description: 'Technology 1 description'
    };
    const mockUpdateTechnologyDto: UpdateTechnologyDto = {
        _id: '6732ed44c1bc4cc79fa3ed4d',
        name: 'Updated Tech',
        description: 'Updated Description',
    };

    const mockTechnologyRelationshipService = {
        checkTechnologyRelations: jest.fn().mockResolvedValue(false), // Giả lập trả về false (không có quan hệ)
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TechnologiesService, //đăng ký service mà chúng ta test
                {
                    provide: getModelToken(Technology.name), //đăng ký mock cho model mongoose
                    useValue: mockTechnologiesModel, //cung cấp mock model đã định nghĩa ở trên
                },
                {
                    provide: TechnologyRelationshipService,  // Mock service quan hệ công nghệ
                    useValue: mockTechnologyRelationshipService,
                },
                PaginationService
            ],
        }).compile();

        //lấy các đối tượng service đã được mock từ testing module (Đối tượng giả lập)
        service = module.get<TechnologiesService>(TechnologiesService);
        technologiesModel = module.get<Model<Technology>>(getModelToken(Technology.name));
    });

    afterEach(() => {
        jest.resetAllMocks(); //xóa tất cả các mock đã tạo
    })

    describe('create', () => {
        it('should create a technology successfully', async () => {
            const user = { _id: 'user1_id' } as any;

            mockTechnologiesModel.findOne.mockResolvedValue(null);
            mockTechnologiesModel.create.mockResolvedValue(mockCreateTechnologyDto);

            const result = await service.create(mockCreateTechnologyDto, user);
            expect(result).toBe('Create technology successfully'); //kiểm tra kq trả về
            expect(mockTechnologiesModel.create).toHaveBeenCalledWith({
                ...mockCreateTechnologyDto, //kiểm tra các trường đã bao gồm các trường mong đợi không
                createdBy: user._id,  //kiểm tra createdBy đã được gán chưa
            });
        });

        it('should throw BadRequestException if technology name already exists', async () => {
            const user = { _id: 'user1_id' } as any;

            mockTechnologiesModel.findOne.mockResolvedValue({ name: 'Nestjs' }); //Mô phỏng tìm thấy tên trùng lặp
            try {
                await service.create(mockCreateTechnologyDto, user);
            }
            catch (error) {
                expect(error).toBeInstanceOf(BadRequestException);  // Kiểm tra xem có phải là BadRequestException không
                expect(error.response.message).toBe('name already exists'); // Kiểm tra thông báo lỗi
            }
        })
    });

    describe('findAll', () => {
        it('should return an array of technologies', async () => {

            const technologies = [
                { _id: 'tech_1', name: 'Tech 1', description: 'Description 1' },
                { _id: 'tech_2', name: 'Tech 2', description: 'Description 2' }
            ];

            const expectedResult = {
                meta: {
                    current: 1,
                    pageSize: 10,
                    pages: 1,
                    total: 2
                },
                result: technologies
            };

            mockTechnologiesModel.find.mockResolvedValue(technologies); // Mock trả về một danh sách công nghệ

            const result = await service.findAll(1, 10, '');
            expect(result).toEqual(expectedResult);
            expect(mockTechnologiesModel.find).toHaveBeenCalled();
        });
    });

    describe('findOne', () => {
        it('should return a technology object if found', async () => {
            const technology = { _id: '6732ed44c1bc4cc79fa3ed4d', name: 'Tech Name', description: 'Tech Description' };

            mockTechnologiesModel.findOne.mockResolvedValue(technology);

            const result = await service.findOne('6732ed44c1bc4cc79fa3ed4d');

            expect(result).toEqual(technology);

            expect(mockTechnologiesModel.findOne).toHaveBeenCalledWith({
                _id: '6732ed44c1bc4cc79fa3ed4d',
                $or: [
                    { isDeleted: { $exists: false } },
                    { isDeleted: false },
                ],
            });
        });

        it('should throw BadRequestException if technology is not found', async () => {
            mockTechnologiesModel.findOne.mockResolvedValue(null);
            await expect(service.findOne('invalid_id')).rejects.toThrow(BadRequestException);
        });
    });

    describe('update', () => {
        const updateTechnology = mockUpdateTechnologyDto;
        const mockUser = { _id: 'user_123' } as any;
        it('should update a technology successfully', async () => {


            mockTechnologiesModel.findOne.mockResolvedValue({
                _id: updateTechnology._id,
                name: updateTechnology.name,
                description: updateTechnology.description,
                isDeleted: false, // Đảm bảo công nghệ không bị xóa
            });
            mockTechnologiesModel.updateOne.mockResolvedValue({ nModified: 1 });
            const result = await service.update(updateTechnology, mockUser);

            expect(result).toBe('Update Technology Successfully');
            expect(mockTechnologiesModel.updateOne).toHaveBeenCalledWith(
                { _id: updateTechnology._id },
                { ...updateTechnology, updatedBy: mockUser._id },
                { new: true }
            );

        })
        it('Should throw BadRequestException if technology is not found', async () => {
            mockTechnologiesModel.findOne.mockResolvedValue(null);
            await expect(service.update(updateTechnology, mockUser)).rejects.toThrow(BadRequestException)
        })
    });

    describe('remove', () => {
        const techId = '6732ed44c1bc4cc79fa3ed4d';
        const mockUser = { _id: 'user_123' } as any;

        it('Should remove successfully', async () => {
            mockTechnologiesModel.findOne.mockResolvedValue({
                _id: techId,
                isDeleted: false
            });
            mockTechnologyRelationshipService.checkTechnologyRelations.mockResolvedValue(false);
            mockTechnologiesModel.updateOne.mockResolvedValue({ nModified: 1 });
            mockTechnologiesModel.softDelete.mockResolvedValue({});

            const result = await service.remove(techId, mockUser);

            expect(result).toBe('Remove Technology successfully');
            expect(mockTechnologyRelationshipService.checkTechnologyRelations).toHaveBeenCalledWith(techId);
            expect(mockTechnologiesModel.updateOne).toHaveBeenCalledWith(
                { _id: techId },
                { deletedBy: mockUser._id }
            );
            expect(mockTechnologiesModel.softDelete).toHaveBeenCalledWith({ _id: techId });
        });
        it('should throw BadRequestException if technology is linked to project', async () => {
            mockTechnologiesModel.findOne.mockResolvedValue({
                _id: techId,
                isDeleted: false
            });
            mockTechnologyRelationshipService.checkTechnologyRelations.mockResolvedValue(true);
            await expect(service.remove(techId, mockUser)).rejects.toThrowError(
                new BadRequestException("Can't remove a technology because it's linked to project")
            );
            expect(mockTechnologyRelationshipService.checkTechnologyRelations).toHaveBeenCalledWith(techId);
        })
        it('should throw BadRequestException if technology does not exist', async () => {
            mockTechnologyRelationshipService.checkTechnologyRelations.mockResolvedValue(false);
            mockTechnologiesModel.findOne.mockResolvedValue(null);
            await expect(service.remove(techId, mockUser)).rejects.toThrowError(
                new BadRequestException("Not found technology")
            )
        })
    })

})