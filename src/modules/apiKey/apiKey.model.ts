import { Model, model, Schema } from 'mongoose';
import { IApiKey } from './apiKey.interface';

export interface IApiKeyModel extends Model<IApiKey> { }
const apiKeySchema = new Schema<IApiKey>(
    {
        name: {
            type: String,
            enum: ["open_ai"],
            default: 'open_ai',
            required: true,
        },

        key: {
            type: String,
            required: true,
        }
    },
    {
        _id: false,
        timestamps: true,
    },
);


const Api_key = model<IApiKey, IApiKeyModel>('api_keys', apiKeySchema);

export default Api_key;