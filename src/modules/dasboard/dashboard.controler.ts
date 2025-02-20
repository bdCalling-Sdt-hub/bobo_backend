import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { dashboardService } from "./dashboard.service";
import sendResponse from "../../utils/sendResponse";
import httpStatus from 'http-status'

const userChart = catchAsync(async (req: Request, res: Response) => {
    const result = await dashboardService.userChart(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'user chart data retrive successfully',
        data: result,
    });
})

const earningChart = catchAsync(async (req: Request, res: Response) => {
    const result = await dashboardService.earningChart(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'earning chart data retrive successfully',
        data: result,
    });
})

const countData = catchAsync(async (req: Request, res: Response) => {
    const result = await dashboardService.countData();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'total count data retrive successfully',
        data: result,
    });
})

export const dashboardControler = {
    userChart,
    earningChart,
    countData
}