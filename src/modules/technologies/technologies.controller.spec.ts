import { Model } from "mongoose";
import { Technology } from "./schema/technology.schema"
import { TechnologiesService } from "./technologies.service"
import { Test, TestingModule } from '@nestjs/testing';
import { TechnologiesController } from "./technologies.controller";
import { CreateTechnologyDto } from "./dto/create-technology.dto";
import { IUser } from "../users/user.interface";
import { BadRequestException } from "@nestjs/common";

describe('TechnologiesController', () => {
    let service: TechnologiesService;
    let controller: TechnologiesController;

    const mockTechnologyService = {
        create: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TechnologiesController],
            providers: [
                {
                    provide: TechnologiesService,
                    useValue: mockTechnologyService,
                },
            ],
        }).compile();
        controller = module.get<TechnologiesController>(TechnologiesController);
        service = module.get<TechnologiesService>(TechnologiesService);
    });
    it('Should be defined', () => {
        expect(controller).toBeDefined();
    })

    describe('create', () => {
        it('should call service create and return success message', async () => {
            const createTechnologyDto: CreateTechnologyDto = { name: 'React', description: 'Alibabba' };
            const user: IUser = { _id: 'user-id' } as IUser;

            mockTechnologyService.create.mockResolvedValue('Create technology successfully');
            const result = await controller.create(createTechnologyDto, user);
            expect(result).toBe('Create technology successfully');
            expect(mockTechnologyService.create).toHaveBeenCalledWith(createTechnologyDto, user);
        });

        it('should throw BadRequestException if name already exists', async () => {
            const createTechnologyDto: CreateTechnologyDto = { name: 'aa', description: 'ABC' };
            const user: IUser = { _id: 'user-id' } as IUser;

            mockTechnologyService.create.mockRejectedValue(new BadRequestException('name already exists'));

            try {
                await controller.create(createTechnologyDto, user);
            } catch (e) {
                expect(e).toBeInstanceOf(BadRequestException);
                expect(e.response.message).toBe('name already exists');
            }
        })
    })
})