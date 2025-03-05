import { Model, ObjectId } from 'mongoose';
import { IPackage } from '../package/package.interface';

export interface ISubscriptions {
  user: ObjectId;
  package: ObjectId | IPackage;
  isPaid: boolean;
  added_members : number;
  comment_limit : number
  amount: number;
  startedAt : Date;
  expiredAt: Date;
  isExpired: boolean;
  isDeleted: boolean;
  createdAt: Date;
}

export type ISubscriptionsModel = Model<
  ISubscriptions,
  Record<string, unknown>
>;
