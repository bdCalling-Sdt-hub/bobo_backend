
import { Types } from "mongoose";

export interface IAccess_comments {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    plans : {
        standard : {
            comment_generate_limit: number,
            comment_generated: number,
            accessCycle: '1' | '2' | '3' | "all",
            expiredAt: Date,
            startedAt: Date,

        } | null,
        premium : {
            comment_generate_limit: number,
            comment_generated: number,
            accessCycle: '1' | '2' | '3' | "all",
            expiredAt: Date,
            startedAt: Date,
        } | null,
        free : {
            comment_generate_limit: number,
            comment_generated: number,
            accessCycle: '1' | '2' | '3' | "all",
            expiredAt: Date | null,
        } | null
    }
}