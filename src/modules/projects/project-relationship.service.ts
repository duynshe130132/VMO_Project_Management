import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Department } from "../departments/schema/department.schema";
import { Model } from "mongoose";

@Injectable()
export class ProjectRelationshipService {
    constructor(
        @InjectModel(Department.name) private readonly departmentModel: Model<Department>,
    ) { }

    async checkProjectRelations(projectId: string): Promise<boolean> {
        const departments = await this.departmentModel.find();
        const isRelation = await departments.some((department) => department.projectId.some((id) => id.toString() === projectId));
        return isRelation;
    }
}