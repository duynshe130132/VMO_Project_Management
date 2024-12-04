import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Role } from "../roles/schema/role.schema";

@Injectable()
export class PermissionRelationshipService {
    constructor(
        @InjectModel(Role.name) private readonly roleModel: Model<Role>,
    ) { }

    async checkPermissionRelations(pId: string): Promise<boolean> {
        const roles = await this.roleModel.find();
        const isRelation = await roles.some((role) => role.permissionId.some((id) => id.toString() === pId));
        return isRelation;
    }
}