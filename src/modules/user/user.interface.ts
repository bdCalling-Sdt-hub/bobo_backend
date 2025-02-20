import { Types } from 'mongoose';

export interface IUser {
  _id : Types.ObjectId;
  status: number; // 1 or 0
  name: string;
  email: string;
  contact: string;
  password: string;
  image: string;
  job_role?: string;
  school?: string
  isverified: boolean
  role: "1" | "2" | "3" | "4" | "5" | '6'; //1 for guest user, 2 for individual teacher, 3 for school admin & 4 for school teacher & 5 for admin & 6 for sub admin
  school_admin: Types.ObjectId //if user is school teacher, set school admin id,
  verification: {
    otp: string | number;
    expiresAt: Date;
    status: boolean;
  };
  isDeleted : boolean
}

