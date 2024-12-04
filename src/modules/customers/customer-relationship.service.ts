import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Project } from "../projects/schema/project.schema";

@Injectable()
export class CustomerRelationshipService {
    constructor(
        @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    ) { }

    async checkCustomerRelations(customerId: string): Promise<boolean> {
        const project = await this.projectModel.findOne({ customerId: customerId });
        return !!project;
    }
}