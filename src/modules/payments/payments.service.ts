import Stripe from 'stripe';
import config from '../../config';
import { IPayment } from './payments.interface';
import { ISubscriptions } from '../subscription/subscription.interface';
import AppError from '../../error/AppError';
import httpStatus from 'http-status';
import Payment from './payments.models';
import { createCheckoutSession } from './payments.utils';
import { startSession } from 'mongoose';
import generateRandomString from '../../utils/generateRandomString';
import Subscription from '../subscription/subscription.models';
import { IPackage } from '../package/package.interface';
import { User } from '../user/user.models';
import Access_comments from '../access_comments/access_comments.model';

import path from 'path';
import fs from 'fs';
import { sendEmail } from '../../utils/mailSender';
import { IUser } from '../user/user.interface';
import moment from 'moment';


const stripe = new Stripe(config.stripe?.stripe_api_secret as string, {
  apiVersion: "2025-01-27.acacia", // Valid API version
  typescript: true,
});

//-----------------create acheck out url---------------------
const checkout = async (payload: IPayment, userId: string) => {
  const tranId = generateRandomString(10);
  let paymentData: IPayment;

  const subscription: ISubscriptions | null = await Subscription.findById(
    payload?.subscription,
  ).populate('package');

  if (!subscription) {
    throw new AppError(httpStatus.NOT_FOUND, 'Subscription Not Found!');
  }

  // Check for existing unpaid payment for the subscription
  const isExistPayment: IPayment | null = await Payment.findOne({
    subscription: payload?.subscription,
    isPaid: false,
    user: userId,
  });

  let amount = subscription?.amount;
  let vat = 0;
  let vatParcentage = 0;

  if (isExistPayment) {
    const payment = await Payment.findByIdAndUpdate(
      isExistPayment?._id,
      { tranId },
      { new: true },
    );

    paymentData = payment as IPayment;
    paymentData.amount = amount;



  } else {
    payload.tranId = tranId;
    payload.amount = amount;
    payload.vatAmount = vat;
    payload.vatParcentage = vatParcentage;
    const createdPayment = await Payment.create({ ...payload, user: userId });
    if (!createdPayment) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Failed to create payment',
      );
    }
    paymentData = createdPayment;

  }

  if (!paymentData) throw new AppError(httpStatus.BAD_REQUEST, 'payment not found');


  const checkoutSession = await createCheckoutSession({
    // customerId: customer.id,
    product: {
      amount: paymentData?.amount,
      //@ts-ignore
      name: subscription?.package?.shortTitle,
      quantity: 1,
    },
    

    //@ts-ignore
    paymentId: paymentData?._id,
  });

  return checkoutSession?.url;

};


const confirmPayment = async (query: Record<string, any>) => {
  const { sessionId, paymentId } = query;
  const session = await startSession();
  const PaymentSession = await stripe.checkout.sessions.retrieve(sessionId);
  const paymentIntentId = PaymentSession.payment_intent as string;

  if (PaymentSession.status !== 'complete') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Payment session is not completed',
    );
  }

  try {
    session.startTransaction();

    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      { isPaid: true, paymentIntentId: paymentIntentId },
      { new: true, session },
    ).populate('user') as unknown as { _id: string, subscription: string, tranId: string, amount: number, createdAt: Date, user: IUser };

    if (!payment) {
      throw new AppError(httpStatus.NOT_FOUND, 'Payment Not Found!');
    }

    const subscription: ISubscriptions | null = await Subscription.findById(
      payment?.subscription,
    )
      .populate('package')
      .session(session);

    if (!subscription) {
      throw new AppError(httpStatus.NOT_FOUND, 'Subscription Not Found!');
    }

    await Subscription.findByIdAndUpdate(
      payment?.subscription,
      {
        isPaid: true,
      },
      {
        session,
      }
    )

    // check user is exist or not
    const user = await User.findById(payment?.user).session(session);

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, 'User Not Found!');
    }

    const packageDetails = subscription?.package as IPackage;

    if (packageDetails) {


      const prevAccess_comment = await Access_comments.findOne({ user: user?._id });


      let plan: "standard" | "premium" | "premium_pro" = "standard";
      let accessCycle: string = "all";


      if (packageDetails?.plan_type === "premium") {
        plan = "premium";
      }
      else if (packageDetails?.plan_type === "premium_pro") {
        plan = "premium_pro";
      } else {
        plan = "standard"
      }

      let comment_generated = prevAccess_comment?.plans?.[plan]?.comment_generated || 0;
      let comment_generat_limit = (prevAccess_comment?.plans?.[plan]?.comment_generate_limit || 0) + subscription.comment_limit;

      let memberLimit = (prevAccess_comment?.member_limit || 0) + subscription?.added_members
      let addedMember = prevAccess_comment?.added_member || 0


      const planData = prevAccess_comment?.plans?.[plan];
      const premiumPlanData = prevAccess_comment?.plans?.premium_pro;

      if (planData?.expiredAt && new Date(planData.expiredAt) <= new Date()) {
        comment_generated = 0;
        comment_generat_limit = subscription.comment_limit || 0;
      }


      if (premiumPlanData?.expiredAt && new Date(premiumPlanData.expiredAt) <= new Date()) {
        memberLimit = subscription?.added_members
        addedMember = 0
      }

      await Access_comments.findOneAndUpdate(
        { user: user?._id },
        {
          $set: {
            [`plans.${plan}.accessCycle`]: accessCycle, [`plans.${plan}.expiredAt`]: subscription?.expiredAt, [`plans.${plan}.comment_generated`]: comment_generated, [`plans.${plan}.comment_generate_limit`]: comment_generat_limit,
            member_limit: memberLimit,
            added_member: addedMember
          },
        },
        { upsert: true, session },
      );


      // -------------send payment confirm email-------------------

      const emailPath = path.join(
        __dirname,
        '../../public/view/confirm_payment.html',
      );

      await sendEmail(
        payment?.user?.email,
        'Payment Confirm',
        fs
          .readFileSync(emailPath, 'utf8')
          .replace('{{name}}', payment?.user?.name)
          .replace('{{tranID}}', payment?.tranId)
          .replace('{{date}}', moment(payment?.createdAt).format('DD MMMM YYYY, hh:mm A'))
          .replace('{{amount}}', payment?.amount.toString())
      )


    }

    await session.commitTransaction();
    return payment;

  } catch (error: any) {

    await session.abortTransaction();

    if (paymentIntentId) {
      try {
        await stripe.refunds.create({
          payment_intent: paymentIntentId,
        });
      } catch (refundError: any) {
        console.error('Error processing refund:', refundError.message);
      }
    }

    throw new AppError(httpStatus.BAD_GATEWAY, error.message);
  } finally {
    session.endSession();
  }
};


const getAllPayments = async () => {
  const payments = await Payment.find();
  if (!payments || payments.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'No payments found');
  }
  return payments;
};

const getPaymentsByUserId = async (
  userId: string,
  query: Record<string, any>,
) => {
  // const paymentQueryBuilder = new QueryBuilder(
  //   Payment.find({ user: userId, isPaid: true }).populate({
  //     path: 'subscription',
  //     populate: { path: 'package' },
  //   }).populate('user'),
  //   query,
  // )
  //   .search(['paymentStatus', 'transactionId', 'subscription.name'])
  //   .filter()
  //   .paginate()
  //   .sort();

  // const data: any = await paymentQueryBuilder.modelQuery;
  // const meta = await paymentQueryBuilder.countTotal();

  // // if (!data || data.length === 0) {
  // //   throw new AppError(httpStatus.NOT_FOUND, 'No payments found for the user');
  // // }

  // return {
  //   data,
  //   meta,
  // };
};

// Get a payment by ID
const getPaymentsById = async (id: string) => {
  const payment = await Payment.findById(id);
  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment not found');
  }
  return payment;
};

// Update a payment by ID
const updatePayments = async (id: string, updatedData: IPayment) => {
  const updatedPayment = await Payment.findByIdAndUpdate(id, updatedData, {
    new: true,
  });
  if (!updatedPayment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment not found to update');
  }
  return updatedPayment;
};

// Delete a payment by ID
const deletePayments = async (id: string) => {
  const deletedPayment = await Payment.findByIdAndDelete(id);
  if (!deletedPayment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment not found to delete');
  }
  return deletedPayment;
};

const generateInvoice = async (payload: any) => {
};

export const paymentsService = {
  // createPayments,
  getAllPayments,
  getPaymentsById,
  updatePayments,
  deletePayments,
  checkout,
  confirmPayment,
  getPaymentsByUserId,
  generateInvoice,
};
