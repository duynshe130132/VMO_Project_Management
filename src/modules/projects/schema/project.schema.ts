import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { ObjectId } from "mongoose";
import { IUser } from "src/modules/users/schema/user.schema";


export type ProjectDocument = HydratedDocument<Project>;

export interface IType {
    _id: mongoose.Schema.Types.ObjectId;
    name: string;
}
export interface IStatus {
    _id: mongoose.Schema.Types.ObjectId;
    name: string;
}
export interface ICustomer {
    _id: mongoose.Schema.Types.ObjectId;
    name: string;
}
export interface ITech {
    _id: mongoose.Schema.Types.ObjectId;
    name: string;
}


@Schema({ timestamps: true })
export class Project {
    @Prop({ require: true })
    name: string;

    @Prop()
    description: string;

    @Prop()
    startDate: Date;

    @Prop()
    endDate: Date;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Projecttype' })
    projectTypeId: IType | mongoose.Schema.Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Status' })
    statusId: IStatus | mongoose.Schema.Types.ObjectId;

    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Technology' }] })
    technologyId: ITech[] | mongoose.Schema.Types.ObjectId[];

    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] })
    userId: IUser[] | mongoose.Schema.Types.ObjectId[];

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Customer' })
    customerId: ICustomer | mongoose.Schema.Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    createdBy: IUser | mongoose.Schema.Types.ObjectId

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    updatedBy: mongoose.Schema.Types.ObjectId

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    deletedBy: mongoose.Schema.Types.ObjectId
}

export interface IProject {
    _id: string;
    name: string;
    projectTypeId: IType | ObjectId;
    statusId: IStatus | ObjectId;
    technologyId: ITech[] | ObjectId;
    userId: IUser[] | ObjectId;
    customerId: ICustomer[] | ObjectId;
}
export const ProjectSchema = SchemaFactory.createForClass(Project);
