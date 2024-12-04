import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type CustomerDocument = HydratedDocument<Customer>;
@Schema({ timestamps: true })
export class Customer {
    @Prop({ require: true })
    name: string;

    @Prop({ require: true })
    phone: string;

    @Prop({ require: true })
    email: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    createdBy: mongoose.Schema.Types.ObjectId

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    updatedBy: mongoose.Schema.Types.ObjectId

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    deletedBy: mongoose.Schema.Types.ObjectId
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
