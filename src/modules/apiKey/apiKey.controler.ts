import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { apiKeyService } from "./apiKey.service";
import sendResponse from "../../utils/sendResponse";
import httpStatus from 'http-status';

const getOpenAi_key = catchAsync(async (req: Request, res: Response) => {
    const result = await apiKeyService.getOpenAi_key()
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Api key retrived successfully',
        data: result,
    });
})

const updateOpenAi_key = catchAsync(async (req: Request, res: Response) => {
    const result = await apiKeyService.updateOpenAi_key(req.body.key)

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Api key update successfully',
        data: result,
    });
})

export const apiKeyControler = {
    getOpenAi_key,
    updateOpenAi_key
}