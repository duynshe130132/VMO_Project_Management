import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Project } from "../projects/schema/project.schema";
import { User } from "./schema/user.schema";
import { Department } from "../departments/schema/department.schema";

@Injectable()
export class UserRelationshipService {
    constructor(
        @InjectModel(Department.name) private readonly departmentModel: Model<Department>,
        @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    ) { }

    async checkUserRelations(userId: string): Promise<boolean> {

        const departmentExists = await this.departmentModel.exists({ user_managerId: userId });

        const projectExists = await this.projectModel.exists({ userId: userId });

        return (departmentExists !== null) || (projectExists !== null);

    }
}