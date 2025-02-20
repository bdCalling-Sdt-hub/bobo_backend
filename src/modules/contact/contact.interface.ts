import mongoose, { ObjectId } from 'mongoose';

export interface Icontact {
  fullname: string;
  email: string;
  cycle : string
  description: string;
}
