import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Project } from "../projects/schema/project.schema";
import { Model } from "mongoose";

@Injectable()
export class StatusRelationshipService {
    constructor(
        @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    ) { }

    async checkStatusRelations(statusId: string): Promise<boolean> {
        const project = await this.projectModel.findOne({ statusId: statusId });
        return !!project;
    }
}