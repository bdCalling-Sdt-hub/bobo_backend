import { Model, model, Schema } from 'mongoose';
import { IAccess_comments } from './access_comments.interface';

export interface IAccess_commentsModel extends Model<IAccess_comments> { }

interface IPlan {
    comment_generate_limit: number;
    comment_generated: number;
    accessCycle: '1' | '2' | '3' | "all";
    startedAt: Date | null
    expiredAt: Date | null;
}

const PlanSchema = new Schema<IPlan>({
    comment_generate_limit: { type: Number, required: true, default: 0 },
    comment_generated: { type: Number, required: true, default: 0 },
    accessCycle: { type: String, required: true, default: 'all' },
    expiredAt: { type: Date },
});

const Access_commentsSchema = new Schema<IAccess_comments>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "users",
        },
        plans: {
            standard: {
                type: PlanSchema, default: () => ({
                    comment_generate_limit: 0,
                    comment_generated: 0,
                    accessCycle: 'all',
                    expiredAt: new Date(),
                })
            },
            premium: {
                type: PlanSchema, default: () => ({
                    comment_generate_limit: 0,
                    comment_generated: 0,
                    accessCycle: 'all',
                    expiredAt: new Date(),
                })
            },
            free: {
                type: PlanSchema, default: () => {
                    return {
                        comment_generate_limit: 5,
                        comment_generated: 0,
                        accessCycle: 'all',
                        expiredAt: null,
                    }
                }
            },

        },
    },
    {
        timestamps: true,
    },
);

const Access_comments = model<IAccess_comments, IAccess_commentsModel>('access_comments', Access_commentsSchema);

export default Access_comments;
