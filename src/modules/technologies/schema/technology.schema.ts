import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type TechnologyDocument = HydratedDocument<Technology>;
@Schema({ timestamps: true })
export class Technology {
    @Prop({ require: true })
    name: string;

    @Prop({ require: true })
    description: string;

    @Prop()
    isDeleted: boolean;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    createdBy: mongoose.Schema.Types.ObjectId

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    updatedBy: mongoose.Schema.Types.ObjectId

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    deletedBy: mongoose.Schema.Types.ObjectId
}

export const TechnologySchema = SchemaFactory.createForClass(Technology);
