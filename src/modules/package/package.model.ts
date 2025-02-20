import { Model, model, Schema } from 'mongoose';
import { IPackage } from './package.interface';



export interface IPackageModel extends Model<IPackage> { }

const PackageSchema = new Schema<IPackage>(
    {
        shortTitle: { type: String },
        shortDescription: { type: String },
        price: { type: Number, required: true, min: 0 },
        comment_limit: { type: Number, required: true, min: 0 },
        duration: {
            type: Number,
            required: true,
            min: 1,
        },
        plan_type: { type: String, enum: ['standard', 'premium'], default: "standard" },
        isDeleted: { type: Boolean, default: false },
    },
    {
        _id : true,
        timestamps: true,
    },
);

const Package = model<IPackage, IPackageModel>('packages', PackageSchema);

export default Package;
