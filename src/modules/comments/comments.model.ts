import { Model, model, Schema } from 'mongoose';
import { IComment } from './comments.interface';

export interface IcommentsModel extends Model<IComment> { }
const commentSchema = new Schema<IComment>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'users',
            required: true,
        },
        prompt: {
            type: Schema.Types.Mixed,
            default : {},
            required: true,
        },
        result: {
            type: String,
            required: true,
        },
        cycle: {
            type: String,
            required: true,
        },
        language: {
            type: String,
            required: true,
        }
    },
    {
        timestamps: true,
    },
);


const Comments = model<IComment, IcommentsModel>('comments', commentSchema);

export default Comments;