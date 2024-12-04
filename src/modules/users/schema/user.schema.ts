import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Exclude } from "class-transformer";
import mongoose, { HydratedDocument } from "mongoose";
import { ObjectId } from "mongoose";

export type UserDocument = HydratedDocument<User>;

export interface IRole {
    _id: mongoose.Schema.Types.ObjectId;
    name: string;
}
export interface ITechnology {
    _id: mongoose.Schema.Types.ObjectId;
    name: string;
}

export interface IDepartment {
    _id: mongoose.Schema.Types.ObjectId;
    name: string;
}

@Schema({ timestamps: true })
export class User {
    @Prop({ require: true })
    name: string;

    @Prop({ require: true })
    email: string;

    @Prop()
    @Exclude()
    password: string;

    @Prop()
    dateOfBirth: Date;

    @Prop()
    address: string;

    @Prop()
    cccd: string;

    @Prop()
    phone: string;

    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Technology' }] })
    technologyId: ITechnology[] | mongoose.Schema.Types.ObjectId[];

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Role' })
    roleId: IRole | mongoose.Schema.Types.ObjectId;

    @Prop()
    yearExp: number;

    @Prop({ type: [String] })
    language: mongoose.Schema.Types.ObjectId[];

    @Prop({
        type: [
            {
                name: { type: String },
                year: { type: Date },
                url: { type: String }
            }
        ],
        default: []
    })
    certificate: {
        name: string,
        year: Date,
        url: string
    }[];

    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }] })
    departmentId: IDepartment[] | mongoose.Schema.Types.ObjectId[];

    @Prop()
    @Exclude()
    refreshToken: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    createdBy: IUser | mongoose.Schema.Types.ObjectId

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    updatedBy: mongoose.Schema.Types.ObjectId

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    deletedBy: mongoose.Schema.Types.ObjectId
}

export interface IUser {
    _id: string;
    name: string;
    email: string;
    technologyId: ITechnology[] | ObjectId;
    roleId: IRole | ObjectId;
    departmentId: IDepartment[] | ObjectId;
    // roleId có thể là ObjectId hoặc đối tượng IRole đã populate
    // Các trường khác...
}
export const UserSchema = SchemaFactory.createForClass(User);
