import { Request, RequestHandler, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { uploadToS3 } from "../../utils/s3";
import { userService } from "./user.service";
import { IUser } from "./user.interface";
import sendResponse from "../../utils/sendResponse";
import httpStatus from 'http-status'
import { User } from "./user.models";
import AppError from "../../error/AppError";

//get all users
const all_users = catchAsync(async (req: Request, res: Response) => {
    const query = req.query
    const result = await userService.allUsers(query)
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Users retrive successfully',
        data: result,
    });
})

const updateProfile = catchAsync(async (req: Request<{}, {}, IUser>, res: Response) => {
    let image;
    if (req.file) {
        image = await uploadToS3({
            file: req.file,
            fileName: `images/user/profile/${Math.floor(100000 + Math.random() * 900000)}`,
        });
    }

    const result = await userService.updateProfile(req.body, req.user._id, image || '')

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'profile updated successfully',
        data: result,
    });

})

//get my profile
const getMyProfile = catchAsync(async (req: Request, res: Response) => {
    const result = await userService.getUserById(req?.user?._id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'profile fetched successfully',
        data: result,
    });
});


//add teacher
const addTeacher = catchAsync(async (req: Request, res: Response) => {
    const reqBody = { email: req?.body.email, name: req.body.firstName + req.body.lastName, password: req?.body?.password }
    const result = await userService.addTeacher(reqBody, req.user._id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'School Teacher created successfully',
        data: result,
    });
});


//update teacher
const updateTeacherById = catchAsync(async (req: Request, res: Response) => {
    const reqBody = { name: req.body.name, status: req.body?.status }
    const result = await userService.updateSchoolTeacher(reqBody, req.params.id, req.user._id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'School Teacher update successfully',
        data: result,
    });
});

const deleteSchoolTeacher = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id
    const result = await userService.deleteSchool_teacher(id, req.user._id)
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'School Teacher deleted successfully',
        data: result,
    });
})

// schoola dmin all teachers
const SchoolTeachers = catchAsync(async (req: Request, res: Response) => {
    const query = req.query
    const result = await userService.mySchoolTeachers(query, req.params.id)
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'School Teacher get successfully',
        data: result,
    });
})

const mySchoolTeachers = catchAsync(async (req: Request, res: Response) => {
    const query = req.query
    const result = await userService.mySchoolTeachers(query, req.user._id)
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'School Teacher get successfully',
        data: result,
    });
})

// status update user
const update_user_status: RequestHandler<{ id: string }, {}, { status: boolean }> = catchAsync(async (req, res) => {
    const result = await userService.status_update_user(req.body, req.params.id)
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'status updated successfully',
        data: result,
    });
})


//add sub admin
const addSubAdmin = catchAsync(async (req: Request, res: Response) => {
    const result = await userService.addSubAdmin(req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Sub Admin created successfully',
        data: result,
    });
});

//delete sub admin
const deleteSubAdmin = catchAsync(async (req: Request, res: Response) => {
    const result = await userService.deleteSubAdmin(req.params.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Sub Admin deleted successfully',
        data: result,
    });
});

//get all subadmin
const allSubAdmins = catchAsync(async (req: Request, res: Response) => {
    const result = await userService.allSubAdmins();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'All subadmins retrived successfully',
        data: result,
    });
});



export const userController = {
    updateProfile,
    getMyProfile,
    addTeacher,
    all_users,
    deleteSchoolTeacher,
    update_user_status,
    SchoolTeachers,
    mySchoolTeachers,
    updateTeacherById,
    addSubAdmin,
    deleteSubAdmin,
    allSubAdmins
}