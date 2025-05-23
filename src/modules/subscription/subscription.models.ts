import { model, Schema } from 'mongoose';
import { ISubscriptions, ISubscriptionsModel } from './subscription.interface';

// Define the Mongoose schema
const SubscriptionsSchema = new Schema<ISubscriptions>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    package: { type: Schema.Types.ObjectId, ref: 'packages', required: true },
    isPaid: { type: Boolean, default: false },
    amount: { type: Number, required: true, min: 0 },
    added_members: { type: Number, required: true, default: 0 },
    comment_limit: { type: Number, required: true, default: 0 },
    startedAt: { type: Date, default: null },
    expiredAt: { type: Date, default: null },
    isExpired: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

SubscriptionsSchema.pre('find', function (next) {
  //@ts-ignore
  this.find({ isDeleted: { $ne: true } });
  next();
});

SubscriptionsSchema.pre('findOne', function (next) {
  //@ts-ignore
  this.find({ isDeleted: { $ne: true } });
  next();
});

SubscriptionsSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});

// Create and export the model
const Subscription = model<ISubscriptions, ISubscriptionsModel>(
  'Subscriptions',
  SubscriptionsSchema,
);

export default Subscription;
