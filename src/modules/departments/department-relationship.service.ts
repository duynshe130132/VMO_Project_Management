import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Project } from "../projects/schema/project.schema";
import { User } from "../users/schema/user.schema";

@Injectable()
export class DepartmentRelationshipService {
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<User>,
    ) { }

    async checkDepartmentRelations(departmentId: string): Promise<boolean> {
        let isRelation = false;

        const users = await this.userModel.find({ departmentId: departmentId });
        if (users) isRelation = true;

        return isRelation;
    }
}