import { Model, ObjectId } from 'mongoose';
import { IPackage } from '../package/package.interface';

export interface ISubscriptions {
  user: ObjectId;
  package: ObjectId | IPackage;
  isPaid: boolean;
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
