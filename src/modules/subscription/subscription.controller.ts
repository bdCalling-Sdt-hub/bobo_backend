import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import { subscriptionService } from './subscription.service';
import sendResponse from '../../utils/sendResponse';
import { User } from '../user/user.models';
import AppError from '../../error/AppError';
import httpStatus from 'http-status'

const createSubscription = catchAsync(async (req: Request<{}, {}, { package: string }>, res: Response) => {
  // req.body.user = req?.user?._id;
  console.log(req?.user._id)
  const result = await subscriptionService.createSubscription(req.body, req?.user._id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subscription created successfully',
    data: result,
  });
});

const getAllSubscription = catchAsync(async (req: Request, res: Response) => {
  const result = await subscriptionService.getAllSubscription(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All subscriptions fetched successfully',
    data: result,
  });
});

// my running subscriptions
const my_running_subscriptions = catchAsync(async (req, res) => {
  let user_Id = req.user._id

  if (req.user.role == '4') {
    const user = await User.findById(req.user._id)
    if (!user?.school_admin) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'School admin not found',
      );
    }
    user_Id = user?.school_admin.toString();
  }

  const result = await subscriptionService.myRunningSubscriptions(user_Id)

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'My current subscription retrive successfully',
    data: result,
  });
})

const getMySubscription = catchAsync(async (req: Request, res: Response) => {
  // const result = await subscriptionService.getSubscriptionByUserId(
  //   req.user?.userId,
  // );
  // sendResponse(res, {
  //   statusCode: 200,
  //   success: true,
  //   message: 'All subscriptions fetched successfully',
  //   data: result,
  // });
});

// const getSubscriptionById = catchAsync(async (req: Request, res: Response) => {
//   const userId = req.user?.userId;
//   const result = await subscriptionService.getSubscriptionById(userId);
//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: 'Subscription fetched successfully',
//     data: result,
//   });
// });


const getSubscriptionByUserId = catchAsync(
  async (req: Request, res: Response) => {
    // const result = await subscriptionService.getSubscriptionByUserId(
    //   req.params.userId,
    // );
    // sendResponse(res, {
    //   statusCode: 200,
    //   success: true,
    //   message: 'Subscription fetched successfully',
    //   data: result,
    // });
  },
);

const updateSubscription = catchAsync(async (req: Request, res: Response) => {
  const result = await subscriptionService.updateSubscription(
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subscription updated successfully',
    data: result,
  });
});

const deleteSubscription = catchAsync(async (req: Request, res: Response) => {
  const result = await subscriptionService.deleteSubscription(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subscription deleted successfully',
    data: result,
  });
});

export const subscriptionController = {
  createSubscription,
  getAllSubscription,
  // getSubscriptionById,
  getSubscriptionByUserId,
  updateSubscription,
  deleteSubscription,
  getMySubscription,
  my_running_subscriptions
};
