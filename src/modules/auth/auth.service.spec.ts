import { AuthService } from "./auth.service"
import { UsersService } from "../users/users.service";
import { MailerService } from "../_shared/mailer/mailer.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { RolesService } from "../roles/roles.service";
import { Test, TestingModule } from "@nestjs/testing";

describe('AuthService', () => {
    let authService: AuthService;
    let mockUsersService: Partial<UsersService>;
    let mockMailerService: Partial<MailerService>;
    let mockJwtService: Partial<JwtService>;
    let mockConfigService: Partial<ConfigService>;
    let mockRolesService: Partial<RolesService>;



    beforeEach(async () => {
        mockUsersService = {
            findByEmail: jest.fn(),
            findUserByToken: jest.fn(),
            hashPassword: jest.fn(),
            updatePassword: jest.fn(),
            updateUserToken: jest.fn(),
        };

        mockMailerService = {
            generateResetPasswordEmail: jest.fn(),
            sendMail: jest.fn(),
        };

        mockJwtService = {
            sign: jest.fn(),
            verify: jest.fn(),
        };

        mockConfigService = {
            get: jest.fn(),
        };

        mockRolesService = {
            findOne: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UsersService, useValue: mockUsersService },
                { provide: MailerService, useValue: mockMailerService },
                { provide: JwtService, useValue: mockJwtService },
                { provide: ConfigService, useValue: mockConfigService },
                { provide: RolesService, useValue: mockRolesService },
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Login', () => {
        it('Should login successfully', async () => {

        })
    })
})