import mongoose, { model, Model, Schema } from 'mongoose';
import { Icontact } from './contact.interface';

export interface contactModel extends Model<Icontact> { }

const ContactSchema: Schema<Icontact> = new Schema(
  {
    fullname: { type: String, required: true },
    email: { type: String, required: true },
    cycle: { type: String },
    description: { type: String, required: true },
  },
  { timestamps: true },
);

export const Contact = model<Icontact, contactModel>('contacts', ContactSchema);
