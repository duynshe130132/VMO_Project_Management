import mongoose, { Model } from "mongoose";
import { CustomersService } from "./customers.service"
import { Customer } from "./schema/customer.schema";
import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { CustomerRelationshipService } from "./customer-relationship.service";
import { PaginationService } from "../_shared/paginate/pagination.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { BadRequestException } from "@nestjs/common";
import { UpdateCustomerDto } from "./dto/update-customer.dto";

describe('CustomersService', () => {
    let service: CustomersService;
    let customerModel: Model<Customer>;

    const mockCustomerModel = {
        findOne: jest.fn(),
        find: jest.fn(),
        create: jest.fn(),
        updateOne: jest.fn(),
        softDelete: jest.fn(),
    };
    const mockCustomerRealtionService = {
        checkCustomerRelations: jest.fn().mockReturnValue(false)
    }
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CustomersService,
                {
                    provide: getModelToken(Customer.name),
                    useValue: mockCustomerModel
                },
                {
                    provide: CustomerRelationshipService,
                    useValue: mockCustomerRealtionService
                },
                PaginationService
            ]
        }).compile();
        service = module.get<CustomersService>(CustomersService);
        customerModel = module.get<Model<Customer>>(getModelToken(Customer.name));
    })
    afterEach(() => {
        jest.resetAllMocks();
    })

    describe('create', () => {
        const mockCreateRoleDto: CreateCustomerDto = {
            name: 'Test customer 1',
            phone: '123456789',
            email: 'test@example.com'
        }
        const mockUser = { _id: 'user_123' } as any;
        it('Should create customer successfully', async () => {
            mockCustomerModel.findOne.mockResolvedValue(null);
            mockCustomerModel.create.mockResolvedValue(mockCreateRoleDto);

            const result = await service.create(mockCreateRoleDto, mockUser);

            expect(result).toStrictEqual(mockCreateRoleDto);
            expect(mockCustomerModel.findOne).toHaveBeenCalledWith(
                { name: mockCreateRoleDto.name }
            );
            expect(mockCustomerModel.create).toHaveBeenCalledWith(
                { ...mockCreateRoleDto, createdBy: mockUser._id }
            )
        })
        it('should throw exception when name already exists', async () => {
            mockCustomerModel.findOne.mockResolvedValue(mockCreateRoleDto);
            await expect(service.create(mockCreateRoleDto, mockUser)).rejects.toThrowError(
                new BadRequestException('Customer already exists')
            )
        })
    })

    describe('findAll', () => {
        const mockCustomers = [
            { _id: 'customer_1', name: 'Test customer 1', phone: '123456789', email: 'test@example.com' },
            { _id: 'customer_2', name: 'Test customer 2', phone: '987654321', email: 'test2@example.com' }
        ]
        it('should get list customers successfully', async () => {
            const resultCustomer = {
                meta: {
                    current: 1,
                    pageSize: 10,
                    pages: 1,
                    total: 2
                },
                result: mockCustomers
            }

            mockCustomerModel.find.mockResolvedValue(mockCustomers);
            const result = await service.findAll(1, 10, '');
            expect(result).toStrictEqual(resultCustomer);
            expect(mockCustomerModel.find).toHaveBeenCalled()
        })
    })

    describe('findOne', () => {
        const mockCustomer = { _id: 'customer_1', name: 'Test customer 1', phone: '123456789', email: 'test@example.com' }
        it('should get customer successfully', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockCustomerModel.findOne.mockResolvedValue(mockCustomer);
            const result = await service.findOne(mockCustomer._id);

            expect(result).toStrictEqual(mockCustomer);
            expect(mockCustomerModel.findOne).toHaveBeenCalledWith(
                {
                    _id: mockCustomer._id,
                    $or: [
                        { isDeleted: { $exists: false } },
                        { isDeleted: false },
                    ]
                }
            )
        })
        it('should throw exception when customer id not found', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockCustomerModel.findOne.mockResolvedValue(null);
            try {
                await service.findOne(mockCustomer._id);
            }
            catch (e) {
                expect(e).toBeInstanceOf(BadRequestException);
                expect(e.message).toBe('Not found customer')
            }
        })
    })

    describe('update', () => {
        const mockUpdateCustomer: UpdateCustomerDto = {
            _id: 'customer_1', name: 'Test customer 1', phone: '123456789', email: 'test@example.com'
        }
        const mockUser = { _id: 'user_123' } as any;
        it('should update customer successfully', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockCustomerModel.findOne.mockResolvedValue(mockUpdateCustomer);

            mockCustomerModel.updateOne.mockResolvedValue(mockUpdateCustomer);
            const result = await service.update(mockUpdateCustomer, mockUser);
            expect(result).toStrictEqual(mockUpdateCustomer);
            expect(mockCustomerModel.findOne).toHaveBeenCalledWith({
                _id: mockUpdateCustomer._id,
                $or: [
                    { isDeleted: { $exists: false } },
                    { isDeleted: false },
                ]
            })
            expect(mockCustomerModel.updateOne).toHaveBeenCalledWith(
                { _id: mockUpdateCustomer._id },
                { ...mockUpdateCustomer, updatedBy: mockUser._id },
                { new: true }
            )
        })
        it('should throw exception when customer id not found to update', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockCustomerModel.findOne.mockResolvedValue(null);
            try {
                await service.update(mockUpdateCustomer, mockUser);
            }
            catch (e) {
                expect(e).toBeInstanceOf(BadRequestException);
                expect(e.message).toBe('Not found customer')
            }
        })
    })

    describe('remove', () => {
        const mockCustomer = {
            _id: 'customer_1', name: 'Test customer 1', phone: '123456789', email: 'test@example.com'
        }
        const mockUser = { _id: "user_123" } as any;
        it('should remove customer successfully', async () => {
            mockCustomerRealtionService.checkCustomerRelations.mockResolvedValue(false);
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockCustomerModel.findOne.mockResolvedValue(mockUser);
            mockCustomerModel.updateOne.mockResolvedValue({ nModified: 1 });
            mockCustomerModel.softDelete.mockResolvedValue({});

            const result = await service.remove(mockCustomer._id, mockUser);

            expect(result).toBe("Delete successfully");
            expect(mockCustomerModel.findOne).toHaveBeenCalledWith(
                {
                    _id: mockCustomer._id,
                    $or: [
                        { isDeleted: { $exists: false } },
                        { isDeleted: false },
                    ],
                }
            )
            expect(mockCustomerModel.updateOne).toHaveBeenCalledWith(
                { _id: mockCustomer._id }, { deletedBy: mockUser._id }
            )
            expect(mockCustomerModel.softDelete).toHaveBeenCalledWith(
                { _id: mockCustomer._id }
            )
        })

        it('should throw exception when object is linked to another object', async () => {
            mockCustomerRealtionService.checkCustomerRelations.mockResolvedValue(true);

            await expect(service.remove(mockCustomer._id, mockUser)).rejects.toThrowError(
                new BadRequestException("Can't remove customer because it's linked to project")
            )
        })
        it('should throw exception when customer id not found to remove', async () => {
            mockCustomerRealtionService.checkCustomerRelations.mockResolvedValue(false);
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            mockCustomerModel.findOne.mockResolvedValue(null);

            await expect(service.remove(mockCustomer._id, mockUser)).rejects.toThrowError(
                new BadRequestException("Not found customer")
            )
        })
    })

})