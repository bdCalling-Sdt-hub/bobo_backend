import { model, Schema } from 'mongoose';
import { IPayment, ISubscriptionsModel } from './payments.interface';

// Define the Mongoose schema
const PaymentSchema = new Schema<IPayment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    subscription: {
      type: Schema.Types.ObjectId,
      ref: 'subscriptions',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    tranId: {
      type: String,
      required: true,
    },
    vatAmount: {
      type: Number,
      required: true,
      default : 0
    },
    vatParcentage: {
      type: Number,
      required: true,
      default : 0
    },
  },
  {
    timestamps: true,
  },
);

PaymentSchema.pre('find', function (next) {
  //@ts-ignore
  this.find({ isDeleted: { $ne: true } });
  next();
});

PaymentSchema.pre('findOne', function (next) {
  //@ts-ignore
  this.find({ isDeleted: { $ne: true } });
  next();
});

PaymentSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});
// Create and export the model
const Payment = model<IPayment, ISubscriptionsModel>('Payment', PaymentSchema);

export default Payment;
