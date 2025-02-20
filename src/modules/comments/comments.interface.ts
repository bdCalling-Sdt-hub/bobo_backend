import { Types } from "mongoose";

export interface IComment {
    _id : Types.ObjectId;
    user: Types.ObjectId;
    prompt : Record<string, any>,
    result : string,
    cycle : string,
    language : string
}