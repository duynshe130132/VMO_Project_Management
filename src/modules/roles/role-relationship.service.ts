import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "../users/schema/user.schema";

@Injectable()
export class RoleRelationshipService {
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<User>,
    ) { }

    async checkRoleRelations(roleId: string): Promise<boolean> {
        const user = await this.userModel.findOne({ roleId: roleId });
        return !!user;
    }
}