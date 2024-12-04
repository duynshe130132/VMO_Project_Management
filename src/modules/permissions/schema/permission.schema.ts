import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type PermissionDocument = HydratedDocument<Permission>;
@Schema({ timestamps: true })
export class Permission {
    @Prop({ require: true })
    name: string;

    @Prop({ require: true })
    apiPath: string;

    @Prop({ require: true })
    method: string;

    @Prop({ require: true })
    module: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    createdBy: mongoose.Schema.Types.ObjectId

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    updatedBy: mongoose.Schema.Types.ObjectId

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    deletedBy: mongoose.Schema.Types.ObjectId
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
