import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type ProjecttypeDocument = HydratedDocument<Projecttype>;
@Schema({ timestamps: true })
export class Projecttype {
    @Prop({ require: true, unique: true })
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

export const ProjecttypeSchema = SchemaFactory.createForClass(Projecttype);
