import { Request, Response } from "express"
import { commentService } from "./comments.service"
import catchAsync from "../../utils/catchAsync"
import sendResponse from "../../utils/sendResponse"
import httpStatus from 'http-status';

//create a new Comment
const saveGeneratedComment = catchAsync(async (req: Request, res: Response) => {

    const result = await commentService.saveGeneratedComment(req.body, req.user._id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Comment save successfully',
        data: result,
    });

})

//get my generated Comments
const myGeneratedComments = catchAsync(async (req: Request, res: Response) => {

    const result = await commentService.myGeneratedComments(req.user._id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'My Comment retrive successfully',
        data: result,
    });

})

export const CommentControler = {
    saveGeneratedComment,
    myGeneratedComments
}