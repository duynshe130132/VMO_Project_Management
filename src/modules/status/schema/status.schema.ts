import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type StatusDocument = HydratedDocument<Status>;
@Schema({ timestamps: true })
export class Status {
    @Prop({ require: true })
    name: string;

    @Prop({ require: true })
    description: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    createdBy: mongoose.Schema.Types.ObjectId

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    updatedBy: mongoose.Schema.Types.ObjectId

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    deletedBy: mongoose.Schema.Types.ObjectId
}

export const StatusSchema = SchemaFactory.createForClass(Status);
