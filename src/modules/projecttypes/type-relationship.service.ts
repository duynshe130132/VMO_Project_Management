import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Project } from "../projects/schema/project.schema";
import { Model } from "mongoose";

@Injectable()
export class TypeRelationshipService {
    constructor(
        @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    ) { }

    async checkProjectRelations(typeId: string): Promise<boolean> {
        const project = await this.projectModel.findOne({ projectTypeId: typeId });
        return !!project;
    }
}