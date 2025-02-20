import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import { ISubscriptions } from './subscription.interface';
import Subscription from './subscription.models';
import { Types } from 'mongoose';
import Package from '../package/package.model';
import Access_comments from '../access_comments/access_comments.model';
import QueryBuilder from '../../builder/QueryBuilder';

const createSubscription = async (payload: { package: string }, userId: string) => {
  // Check if a similar subscription exists
  const isExist = await Subscription.findOne({
    user: userId,
    package: payload.package,
    isPaid: false,
  });

  if (isExist) {
    return isExist;
  }

  let newPayload = {
    package: payload.package,
    expiredAt: new Date(),
  }

  // Find the package details
  const packages = await Package.findOne({ _id: payload.package });

  if (!packages) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Package not found');
  }


  const currentDate = new Date();
  const durationInMilliseconds = packages.duration * 24 * 60 * 60 * 1000;
  newPayload.expiredAt = new Date(
    currentDate.getTime() + durationInMilliseconds,
  );

  // has a running subscription
  const exist_access_comments = await Access_comments.findOne({ user: userId });

  let new_expired: Date | null = new Date();
  let new_started: Date | null = new Date();

  if (packages.plan_type == 'standard') {
    if (exist_access_comments?.plans.standard?.expiredAt) {
      new_expired = new Date(
        exist_access_comments.plans.standard.expiredAt.getTime() + packages.duration * 24 * 60 * 60 * 1000
      )
      new_started = exist_access_comments.plans.standard.expiredAt
    } else {
      new_expired = new Date(
        Date.now() + packages.duration * 24 * 60 * 60 * 1000
      );
    }
  } else if (packages.plan_type == 'premium') {
    if (exist_access_comments?.plans.premium?.expiredAt) {
      new_expired = new Date(
        exist_access_comments.plans.premium.expiredAt.getTime() + packages.duration * 24 * 60 * 60 * 1000
      )
      new_started = exist_access_comments.plans.premium.expiredAt
    } else {
      new_expired = new Date(
        Date.now() + packages.duration * 24 * 60 * 60 * 1000
      );
    }
  }

  // Create the subscription
  const result = await Subscription.create({ amount: packages?.price, user: userId, startedAt: new_expired, expiredAt: new_expired, package: packages._id });
  // console.log('result:', result);

  if (!result) {
    throw new Error('Failed to create subscription');
  }

  return result;
};

const getAllSubscription = async (query: Record<string, any>) => {
  const subscriptionsModel = new QueryBuilder(
    Subscription.find({ isPaid: true }).populate(['package', 'user']),
    query,
  )
    .search([])
    .filter()
    .paginate()
    .sort()
    .fields();

  subscriptionsModel.modelQuery =
    subscriptionsModel.modelQuery.sort('createdAt');

  const data = await subscriptionsModel.modelQuery;
  const meta = await subscriptionsModel.countTotal();
  return {
    data,
    meta,
  };
};



//my subscriptions
const myRunningSubscriptions = async (userId: string) => {

  let response = []
  const result = await Access_comments.findOne({ user: userId }).lean();

  if (result) {
    if (result.plans.premium?.expiredAt && (new Date(result.plans.premium?.expiredAt) > new Date())) {
      if (result.plans.premium?.comment_generate_limit > result.plans.premium?.comment_generated) {
        response.push({ ...result.plans.premium, plan: 'premium' })
      }
    }

    if (result.plans.standard?.expiredAt && (new Date(result.plans.standard?.expiredAt) > new Date())) {
      if (result.plans.standard?.comment_generate_limit > result.plans.standard?.comment_generated) {
        response.push({ ...result.plans.standard, plan: 'standard' })
      }
    }

  }

  return response
}




const getSubscriptionById = async (userId: string) => {
  const result = await Subscription.findOne({
    user: userId,
    isPaid: true,
  })
    .populate(['package', 'user'])
    .sort('-createdAt');
  // return [result];
  return result ? [result] : [];
};

const getSubscriptionByUserId = async (id: string) => {
  const result = await Subscription.find({
    user: new Types.ObjectId(id),
  }).populate(['package', 'user']);

  return result;
};

const updateSubscription = async (
  id: string,
  payload: Partial<ISubscriptions>,
) => {
  const result = await Subscription.findByIdAndUpdate(id, payload, {
    new: true,
  });
  if (!result) {
    throw new Error('Failed to update subscription');
  }
  return result;
};

const deleteSubscription = async (id: string) => {
  const result = await Subscription.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );
  if (!result) {
    throw new Error('Failed to delete subscription');
  }
  return result;
};

export const subscriptionService = {
  createSubscription,
  getAllSubscription,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
  getSubscriptionByUserId,
  myRunningSubscriptions
};
