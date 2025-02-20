import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import { paymentsService } from './payments.service';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import config from '../../config';

const checkout = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentsService.checkout(req.body, req.user._id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: result,
    message: 'payment link get successful',
  });
});

const confirmPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentsService.confirmPayment(req?.query);
  res.redirect(`${config.client_Url}${config.success_url}?subscriptionId=${result?.subscription}&paymentId=${result?._id}`);
  // sendResponse(res, {
  //   success: true,
  //   statusCode: httpStatus.OK,
  //   data: result,
  //   message: 'payment successful',
  // });
});

const getPaymentsByUserId = catchAsync(async (req: Request, res: Response) => {
  // const userId = req.user?.userId;
  // const result = await paymentsService.getPaymentsByUserId(userId, req.query);
  // if (!result) {
  //   return sendResponse(res, {
  //     success: false,
  //     statusCode: httpStatus.NOT_FOUND,
  //     message: 'Payment not found',
  //     data: {},
  //   });
  // }
  // sendResponse(res, {
  //   success: true,
  //   statusCode: httpStatus.OK,
  //   data: result,
  //   message: 'Payment retrieved successfully',
  // });
});

const getPaymentsByUserIdWithParams = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await paymentsService.getPaymentsByUserId(id, req.query);
  // if (!result) {
  //   return sendResponse(res, {
  //     success: false,
  //     statusCode: httpStatus.NOT_FOUND,
  //     message: 'Payment not found',
  //     data: {},
  //   });
  // }
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: result,
    message: 'Payment retrieved successfully',
  });
});

const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentsService.getAllPayments(); // Assume this service method exists
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: result,
    message: 'All payments retrieved successfully',
  });
});

const getPaymentsById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await paymentsService.getPaymentsById(id); // Assume this service method exists
  if (!result) {
    return sendResponse(res, {
      success: false,
      statusCode: httpStatus.NOT_FOUND,
      message: 'Payment not found',
      data: {},
    });
  }
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: result,
    message: 'Payment retrieved successfully',
  });
});

const updatePayments = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const paymentData = req.body;
  const result = await paymentsService.updatePayments(id, paymentData); // Assume this service method exists
  if (!result) {
    return sendResponse(res, {
      success: false,
      statusCode: httpStatus.NOT_FOUND,
      message: 'Payment not found',
      data: {},
    });
  }
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: result,
    message: 'Payment updated successfully',
  });
});
const deletePayments = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await paymentsService.deletePayments(id);
  if (!result) {
    return sendResponse(res, {
      success: false,
      statusCode: httpStatus.NOT_FOUND,
      message: 'Payment not found',
      data: {},
    });
  }
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.NO_CONTENT,
    message: 'Payment deleted successfully',
    data: result,
  });
});

export const paymentsController = {
  getAllPayments,
  getPaymentsById,
  updatePayments,
  deletePayments,
  confirmPayment,
  checkout,
  getPaymentsByUserId,
  getPaymentsByUserIdWithParams,
};
