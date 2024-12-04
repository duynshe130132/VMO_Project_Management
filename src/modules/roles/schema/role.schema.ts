import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type RoleDocument = HydratedDocument<Role>;
@Schema({ timestamps: true })
export class Role {
    @Prop({ require: true })
    name: string;

    @Prop({ require: true })
    description: string;

    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }] })
    permissionId: mongoose.Schema.Types.ObjectId[];

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    createdBy: mongoose.Schema.Types.ObjectId

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    updatedBy: mongoose.Schema.Types.ObjectId

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    deletedBy: mongoose.Schema.Types.ObjectId
}

export const RoleSchema = SchemaFactory.createForClass(Role);
