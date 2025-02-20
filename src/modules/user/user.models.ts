import mongoose, { Schema, model, Model, Types } from 'mongoose';
import { IUser } from './user.interface';


export interface UserModel extends Model<IUser> { }

// Mongoose schema definition
const userSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      validate: {
        validator: function (this: IUser, value: Types.ObjectId | undefined) {
          if (this.role != '1' && !value) {
            return false;
          }
          return true;
        },
        message: 'Name is required',
      }
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    contact: {
      type: String,
      required: false,
    },
    password: {
      type: String,
      validate: {
        validator: function (this: IUser, value: Types.ObjectId | undefined) {
          if (this.role != '1' && !value) {
            return false;
          }
          return true;
        },
        message: 'password is required',
      }
    },
    image: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      required: true,
      enum: ['1', '2', '3', '4', '5', '6'], //2 for individual teacher, 3 for school admin & 4 for school teacher & 5 for admin & 6 for sub admin
      default: '1'
    },
    school_admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      validate: {
        validator: function (this: IUser, value: Types.ObjectId | undefined) {
          if (this.role === '4' && !value) {
            return false;
          }
          return true;
        },
        message: 'The "school_admin" field is required for role "4" (school teacher).',
      }
    },
    job_role: {
      type: String
    },
    school: {
      type: String
    },
    isverified: {
      type: Boolean,
      default: false
    },
    status: {
      type: Number,
      default: 1,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    verification: {
      otp: {
        type: Schema.Types.Mixed,
        default: 0,
      },
      expiresAt: {
        type: Date,
      },
      status: {
        type: Boolean,
        default: false,
      },
    }
  },
  {
    timestamps: true,
    _id: true
  },
);



// User model creation
export const User = model<IUser, UserModel>('users', userSchema);
