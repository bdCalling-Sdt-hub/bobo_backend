import { Types } from "mongoose";

export interface IPackage {
    _id: Types.ObjectId;
    shortTitle: string;
    shortDescription: string;
    comment_limit: number,
    plan_type: "standard" | "premium",
    duration: number
    price: number;
    isDeleted: boolean
}