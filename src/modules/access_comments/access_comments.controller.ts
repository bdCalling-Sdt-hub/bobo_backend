import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { access_commentsService } from "./access_comments.service";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status"
import Access_comments from "./access_comments.model";
import { User } from "../user/user.models";
import AppError from "../../error/AppError";
import { commentService } from "../comments/comments.service";
import Api_key from "../apiKey/apiKey.model";

const generate_comment = catchAsync(async (req: Request, res: Response) => {

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

    const { usedPlan, accessCycle } = await access_commentsService.checkAccess(user_Id, req.user.role, req.body.cycle)


    //get api key
    const api_key = await Api_key.findOne({ name: "open_ai" });

    if (!api_key) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'Api key not found',
        );
    }

    const result = await access_commentsService.generate_comment(req.body, api_key?.key);

    // incremnt by 1 comment_generated
    await Access_comments.findOneAndUpdate(
        { user: user_Id },
        {
            $set: { [`plans.${usedPlan}.accessCycle`]: accessCycle },
            $inc: { [`plans.${usedPlan}.comment_generated`]: 1 }
        }
    );


    // save my generated comments
    await commentService.saveGeneratedComment({ cycle: req.body.cycle, language: req.body.language, prompt: req.body.feedbackData, result: result }, req?.user?._id)

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Comment generated successfully',
        data: { comment: result },
    });
})

const getSubscriptionWithExpired_by_7days = catchAsync(async (req: Request, res: Response) => {
    const user = await access_commentsService.sendReminderEmail()
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'users',
        data: user,
    });
})

export const access_comments_controller = {
    generate_comment,
    getSubscriptionWithExpired_by_7days
}