import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type DepartmentDocument = HydratedDocument<Department>;
@Schema({ timestamps: true })
export class Department {
    @Prop({ require: true })
    name: string;

    @Prop({ require: true })
    description: string;

    @Prop({ require: true })
    foundingDate: Date;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    user_managerId: mongoose.Schema.Types.ObjectId;

    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }] })
    projectId: mongoose.Schema.Types.ObjectId[]

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    createdBy: mongoose.Schema.Types.ObjectId


    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    updatedBy: mongoose.Schema.Types.ObjectId

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    deletedBy: mongoose.Schema.Types.ObjectId
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);
