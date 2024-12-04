import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { compareSync, genSaltSync, hashSync } from 'bcryptjs';
import { InjectModel } from '@nestjs/mongoose';
import * as crypto from 'crypto';
import { IRole, User, UserDocument } from './schema/user.schema';
import { PaginationService } from '../_shared/paginate/pagination.service';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import mongoose from 'mongoose';
import { ChangePasswordDto } from './dto/authentication-dto.';
import { IUser } from './user.interface';
import { DepartmentsService } from '../departments/departments.service';
import { ProjectsService } from '../projects/projects.service';
import { UserRelationshipService } from './user-relationship.service';
import { MailerService } from '../_shared/mailer/mailer.service';
import { AuthService } from '../auth/auth.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: SoftDeleteModel<UserDocument>,
    @Inject(forwardRef(() => DepartmentsService)) private departmentService: DepartmentsService,
    @Inject(forwardRef(() => ProjectsService)) private projectService: ProjectsService,
    @Inject(forwardRef(() => AuthService)) private authService: AuthService,
    private relationService: UserRelationshipService,
    private mailerService: MailerService,
    private configService: ConfigService,
    private paginationService: PaginationService) { }


  async register(createUserDto: CreateUserDto, user: IUser) {
    const password = this.generateRandomPassword();
    const newUser = await this.create(createUserDto, user._id);
    const hashPassword = this.hashPassword(password)
    await this.updatePassword(newUser._id.toString(), hashPassword);
    const mailOptions = await this.mailerService.generateRegisterEmail(createUserDto.email, newUser.email, password);
    await this.mailerService.sendMail(mailOptions);
    return "Register successfully !"
  }

  async sendRequestCreateForAdmin(user: IUser, createUserDto: CreateUserDto) {
    if (createUserDto.roleId.toString() !== "673308e8361cf574b01a19cc")
      throw new BadRequestException("You must assign the role of 'Employee'");

    const managerDepartment = await this.departmentService.findManagerDepartment(user._id);
    const departmentIds = managerDepartment.map(d => d._id.toString());


    if (createUserDto.departmentId) {
      const isExistManagerDep = departmentIds.some(dId => dId === createUserDto.departmentId.toString())
      if (!isExistManagerDep)
        throw new BadRequestException("You can't send request create new members outside your department")
    }

    const token = await this.authService.createUserToken(createUserDto);
    const resetPasswordLink = `http://your-actual-domain.com/reset-password?token=${token}`;
    const emailAdmin = await this.configService.get<string>('GMAIL_CONTACT');
    const mailOptions = await this.mailerService.generateSendRequestRegister(emailAdmin, resetPasswordLink);
    await this.mailerService.sendMail(mailOptions);
    return { message: "Send request successfully" };
  }

  async preview_requestCreateUser(token: string) {
    try {
      const decoded = await this.authService.decodeToken(token);
      return {
        success: true,
        data: decoded,
      };
    } catch (error) {
      throw new BadRequestException('Invalid or expired token');
    }
  }
  async acceptRequestCreateUser(token: string, user: IUser) {
    try {
      const userData = await this.authService.decodeToken(token);
      await this.register(userData, user);
      return { success: true, message: 'User created successfully.' };
    } catch (error) {
      throw new BadRequestException('Invalid or expired token.');
    }
  }

  async rejectRequestCreateUser(token: string) {
    try {
      const userData = this.authService.decodeToken(token);

      return { success: true, message: 'User creation request rejected.' };
    } catch (error) {
      throw new BadRequestException('Invalid or expired token.');
    }
  }

  handleGetProfile(user: IUser) {
    const objUser = this.findOne(user._id);
    return objUser;
  }

  async findAll(currentPage: number, limit: number, qs: string) {
    const users = await this.userModel.find().select('-password -refreshToken');
    return await this.paginationService.getPagination(users, currentPage, limit, qs);
  }

  async getUserById(id: string, user: IUser) {
    const role = user.roleName;
    let results;
    try {
      switch (role) {
        case 'Admin':
          results = await this.findOne(id);
          break;
        case 'Manager':
          results = await this.findInManagerDepById(id, user);
          break;
        default:
          throw new UnauthorizedException('Invalid role');
      }
      return results;
    }
    catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAllByRole(roleId: string, currentPage: number, limit: number, qs: string) {
    const users = await this.userModel.find({ roleId: roleId }).select('-password -refreshToken');
    if (!users)
      throw new BadRequestException('Not found users');
    return await this.paginationService.getPagination(users, currentPage, limit, qs);
  }

  async findAllByDepartmentId(user: IUser, departmentId: string, currentPage: number, limit: number, qs: string) {
    try {
      const role = user.roleName;
      let results;
      switch (role) {
        case 'Admin':
          results = await this.listAllByDepartmentId(departmentId);
          break;
        case 'Manager':
          results = await this.listAllByManagerDepId(departmentId, user);
          break;
        case 'Employee':
          results = await this.listDepMateByDepId(departmentId, user);
          break;
        default:
          throw new UnauthorizedException('Invalid role');
      }

      return this.paginationService.getPagination(results, currentPage, limit, qs);
    }
    catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async listAllUserByProjectId(projectId: string, user: IUser, currentPage: number, limit: number, qs: string) {
    try {
      const role = user.roleName;
      let results;
      switch (role) {
        case 'Admin':
          results = await this.findAllUserByProjectId(projectId);
          break;
        case 'Manager':
          results = await this.findAllByManagerProjectId(projectId, user);
          break;
        case 'Employee':
          results = await this.findProjectMateByProjectId(projectId, user);
          break;
        default:
          throw new UnauthorizedException('Invalid role');
      }
      return this.paginationService.getPagination(results, currentPage, limit, qs);
    }
    catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(updateUserDto: UpdateUserDto) {
    if (!updateUserDto._id) {
      throw new BadRequestException('User ID is required');
    }
    const existingUser = await this.userModel.findOne({ _id: updateUserDto._id });
    if (!existingUser) {
      throw new BadRequestException('User not found');
    }
    if (!mongoose.Types.ObjectId.isValid(updateUserDto._id)) {
      throw new BadRequestException('Invalid User ID');
    }
    try {
      const updatedUser = await this.userModel.updateOne({ _id: updateUserDto._id }, { ...updateUserDto }, { new: true });
      return 'Update successfully';
    }
    catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async remove(id: string) {
    try {
      const isRelation = await this.relationService.checkUserRelations(id);
      if (isRelation)
        throw new BadRequestException('Cannot delete user with existing relations');
      await this.userModel.softDelete({ _id: id });
      return "Delete user successfully"
    }
    catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////////

  async listAllByDepartmentId(departmentId: string) {
    const users = await this.userModel.find();
    const results = users.filter(user => user.departmentId.some(dId => dId.toString() === departmentId));
    if (results.length === 0)
      throw new BadRequestException('Not found users');
    return results;
  }
  async listAllByManagerDepId(id: string, user: IUser) {
    console.log("Manager");
    const isManagerDepartment = await this.departmentService.isManagerDepartment(user._id, id)
    if (!isManagerDepartment)
      throw new BadRequestException("Department are not available for this user");
    const users = await this.findUserByDepId(id);
    return users;
  }

  async listDepMateByDepId(depId: string, user: IUser) {
    const userTemp = await this.userModel.find();
    const userObj = await this.userModel.findOne({ _id: user._id });
    const userDepIds = userObj.departmentId;
    const isExistInUserDep = userDepIds.some(id => id.toString() === depId);
    if (!isExistInUserDep)
      throw new BadRequestException('Department is not available for user');
    const users = userTemp.filter(user => user.departmentId.some(id => id.toString() === depId));
    return await users;
  }


  async findAllUserByProjectId(id: string) {
    const usersId = await this.projectService.findUserByProjectId(id);
    const users = await this.userModel.find({ _id: { $in: usersId } }).select('-password -refreshToken');
    if (!users) throw new BadRequestException('not found user');

    return users;
  }

  async findAllByManagerProjectId(id: string, user: IUser) {
    const isManagerProject = await this.projectService.isManagerProject(id, user._id)
    if (!isManagerProject)
      throw new BadRequestException("Project are not available for this user");
    const userIds = await this.projectService.findUserByProjectId(id);
    if (userIds.length === 0)
      throw new BadRequestException('Not found user');

    const users = await this.userModel.find({ _id: { $in: userIds } }).select('-password -refreshToken');
    return users;
  }

  async findProjectMateByProjectId(projectId: string, user: IUser) {
    const project = await this.projectService.findOne(projectId);

    const isExistInUserProject = project.userId.some(userId => userId.toString() === user._id);
    if (!isExistInUserProject)
      throw new BadRequestException('Project is not available for this user');

    const userInPIds = project.userId;
    const users = await this.userModel.find({ _id: { $in: userInPIds } }).select('-password -refreshToken');

    return users;
  }


  async findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid User ID');
    }
    const existingUser = await this.userModel
      .findOne({ _id: id })
      .populate({ path: 'roleId', select: 'name' })
      .select('-password -refreshToken') as UserDocument & { roleId: IRole };

    if (!existingUser) {
      throw new BadRequestException('User not found');
    }
    return existingUser;
  }

  async findInManagerDepById(userId: string, user: IUser) {
    const userObj = await this.findOne(userId);
    const userDepIds = userObj.departmentId;
    const managerDepartments = await this.departmentService.findManagerDepartment(user._id);
    const mngDepIds = managerDepartments.map(department => department._id.toString());
    const isUserInManagerDep = userDepIds.some(depId => mngDepIds.includes(depId.toString()));

    if (!isUserInManagerDep)
      throw new BadRequestException('User is not available for this manager department');

    return userObj;
  }


  hashPassword(password: string) {
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);
    return hash;
  }

  isValidPassword(password: string, hash: string) {
    return compareSync(password, hash);
  }

  generateRandomPassword(length: number = 12): string {
    return crypto.randomBytes(length).toString('base64').slice(0, length);
  }


  async create(createUserDto: CreateUserDto, id: string) {
    const isExistEmail = await this.findByEmail(createUserDto.email);
    if (isExistEmail) {
      throw new BadRequestException("Email already exists");
    }
    try {
      const newUser = await this.userModel.create({ ...createUserDto, createdBy: id });
      return newUser;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }


  //for projectModule
  async findAllUser() {
    return await this.userModel.find();
  }

  async findByEmail(email: string) {
    const user = await this.userModel.findOne({ email });
    return user;
  }

  findUserByToken = async (refreshToken: string) => {
    return this.userModel.findOne({ refreshToken })
  }

  //for manager
  async updateDepartmentId(userId: string, departmentId: string) {
    const result = await this.userModel.updateOne({ _id: userId }, { departmentId: departmentId });
    if (result.modifiedCount === 0) {
      throw new BadRequestException('Update failed');
    }
  }

  async updatePassword(userId: string, password: string) {
    try {
      const user = await this.userModel.findOne({ _id: userId });
      if (!user) {
        throw new BadRequestException('User not found');
      }
      user.password = password;
      await user.save();
    }
    catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async changePassword(changePasswordDto: ChangePasswordDto, payload: any) {
    const { _id } = payload;
    const user = await this.userModel.findOne({ _id })
    if (!user) {
      throw new BadRequestException("User not found");
    }

    const isOldPasswordValid = await this.isValidPassword(changePasswordDto.oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new BadRequestException("Old password is not correct");
    }

    if (changePasswordDto.newPassword !== changePasswordDto.re_newPassword) {
      throw new BadRequestException("New password and re-new password does not match");
    }

    const hashPassword = this.hashPassword(changePasswordDto.newPassword);

    await this.userModel.updateOne({ _id: user._id }, { password: hashPassword }, { new: true })
  }

  updateUserToken = async (refreshToken: string, id: string) => {
    return await this.userModel.updateOne(
      { _id: id },
      { refreshToken }
    )
  }

  //Manager
  async findUserByDepId(id: string) {
    const users = await this.userModel.find().select('-password -refreshToken');
    const results = users.filter(user => user.departmentId.some(depId => depId.toString() === id));
    if (results.length === 0) throw new BadRequestException('not found user');

    return results
  }

  //manager + Employee

  async findAllDepByUserId(userId: string) {
    const user = await this.userModel.findOne({ _id: userId });
    const departments = user.departmentId;

    return departments;
  }

  async isIdUserExist(id: string) {
    const user = await this.userModel.findOne({ _id: id });
    if (user) return true;
    return false;
  }

  ///////////////////////////////Export/////////////////////////////
  excel_getAll(query: any) {
    return this.userModel.find(query).populate('roleId', 'name')
      .populate('technologyId', 'name')
      .populate('departmentId', 'name')
      .populate('createdBy', 'email').exec();
  }

  async findAllByAdminFilters(
    filters: { departmentId?: string; projectId?: string; name?: string; technologyId?: string }
  ): Promise<any[]> {
    const { departmentId, projectId, name, technologyId } = filters;

    let query: any = {};
    if (departmentId) {
      const department = await this.departmentService.findOne(departmentId);
      if (!department)
        throw new BadRequestException("Department not found");
      query.departmentId = departmentId;
    }
    if (projectId) {
      const userIds = await this.projectService.findUserByProjectId(projectId);
      if (userIds.length === 0) throw new BadRequestException("No users found for this project");
      query._id = { $in: userIds };
    }

    if (name) query.name = { $regex: name, $options: "i" };
    if (technologyId) query.technologyId = technologyId;

    const users = await this.excel_getAll(query)
    return users;

  }
  async findAllByManagerFilters(
    user: IUser,
    filters: { departmentId?: string; projectId?: string; name?: string; technologyId?: string }
  ): Promise<any[]> {
    const { departmentId, projectId, name, technologyId } = filters;

    let query: any = {};

    if (departmentId) {
      const isExistDepartment = await this.departmentService.isManagerDepartment(user._id, departmentId);
      if (!isExistDepartment)
        throw new BadRequestException("Department are not available for this user");
      const department = await this.departmentService.findOne(departmentId);
      if (!department) throw new NotFoundException("Department not found");
      query.departmentId = departmentId;
    }

    if (projectId) {
      const isManagerProject = await this.projectService.isManagerProject(projectId, user._id);
      if (!isManagerProject) throw new BadRequestException("Project is not available for this user");

      const userIds = await this.projectService.findUserByProjectId(projectId);
      if (userIds.length === 0) throw new BadRequestException("No users found for this project");

      query._id = { $in: userIds };
    }

    if (name) query.name = { $regex: name, $options: "i" };
    if (technologyId) query.technologyId = technologyId;

    const users = await this.excel_getAll(query)
    return users;
  }

}
