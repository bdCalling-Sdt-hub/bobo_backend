import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../error/AppError";
import { IUser } from "./user.interface";
import { User } from "./user.models";
import httpStatus from 'http-status'
import bcrypt from 'bcrypt'
import Access_comments from "../access_comments/access_comments.model";

import path from 'path';
import fs from 'fs';
import { sendEmail } from "../../utils/mailSender";
import config from "../../config";
import { createToken, verifyToken } from "../auth/auth.utils";
import generateRandomString from "../../utils/generateRandomString";

const updateProfile = async (payload: IUser, userId: string, image: string) => {
    const { contact, name, job_role, school } = payload

    const updateFields: Partial<IUser> = { contact, name, job_role, school };

    if (image) updateFields.image = image;

    // Remove undefined or null fields to prevent overwriting existing values with null
    Object.keys(updateFields).forEach((key) => {
        if (updateFields[key as keyof IUser] === undefined || updateFields[key as keyof IUser] === '' || updateFields[key as keyof IUser] === null) {
            delete updateFields[key as keyof IUser];
        }
    });

    if (Object.keys(updateFields).length === 0) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'No valid field found',
        );
    }

    const result = await User.updateOne({ _id: userId }, updateFields)

    return result

}

//get all users
const allUsers = async (query: Record<string, any>) => {
    const userModel = new QueryBuilder(User.find({ role: { $nin: ['5', '6'] } }), query)
        .search(['name', 'email', 'contact', 'school'])
        .filter()
        .paginate()
        .sort();
    const data: any = await userModel.modelQuery;
    const meta = await userModel.countTotal();
    return {
        data,
        meta,
    };
}


const getUserById = async (id: string) => {
    const result = await User.findById(id, { password: 0, verification: 0 });
    return result;
};


//check user has a premium access for teacher addition
const checkSchoolAdminHasPremiumProAccess = async (userId: string) => {
    const userAccess = await Access_comments.findOne({ user: userId });

    if (!userAccess) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'You have not access for use premium feature',
        );
    }

    //check user created subscription or not
    if (userAccess.plans.premium_pro?.comment_generate_limit == 0) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "You don’t have an active subscription",
        );
    }

    if (userAccess.plans.premium_pro?.expiredAt && (new Date(userAccess.plans.premium_pro?.expiredAt) > new Date())) {

        // ----------check school teacher has a limit for teacher add ---------------
        if (userAccess?.member_limit <= userAccess?.added_member) {
            throw new AppError(
                httpStatus.FORBIDDEN,
                "You've reached your invite limit. Please purchase a new package to send more invites",
            );
        }

        return;

    } else {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'Your premium subscription expired !',
        );
    }

}


//add new Teacher
const addTeacher = async (payload: { email: string, name: string, password: string }, userId: string) => {

    //check school admin has a premium package
    await checkSchoolAdminHasPremiumProAccess(userId)


    let user = await User.findOne({ email: payload?.email });

    const randomPassword = generateRandomString(8);

    let tmp_password;

    //create teacher if user is not exist
    if (!user) {
        tmp_password = randomPassword;
        const hashedPassword = await bcrypt.hash(randomPassword, 15);

        user = await User.create({ email: payload.email, role: '4', school_admin: userId, name: payload.name, password: hashedPassword });

        if (!user) {
            throw new AppError(httpStatus.BAD_REQUEST, 'Teacher creation failed');
        }
    }

    //add temporary password if user is a guest user
    else if (user?.role == '1') {

        tmp_password = randomPassword;

        const hashedPassword = await bcrypt.hash(randomPassword, 15);

        await User.updateOne({ email: payload.email }, { password: hashedPassword, school_admin: userId });
    }
    else {
        await User.updateOne({ email: payload.email }, { school_admin: userId });
    }

    const EmailPath = path.join(
        __dirname,
        '../../public/view/school_teacher_invitation.html',
    );

    const jwtPayload: { userId: string; role: string } = {
        userId: user?._id?.toString() as string,
        role: user?.role,
    };

    const token = createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        60 * 60 * 24 * 7, //7 days
    );

    await sendEmail(
        payload?.email,
        'School Teacher account invitation',
        fs
            .readFileSync(EmailPath, 'utf8')
            .replace('{{link}}', (config.SERVER_URL + `/users/acceptinvitation/${token}`))
            .replace('{{link1}}', (config.SERVER_URL + `/users/acceptinvitation/${token}`))
            .replace('{{link2}}', (config.SERVER_URL + `/users/acceptinvitation/${token}`))
            .replace('{{school}}', user?.school ?? 'A school')
            .replace('{{tmp_password}}', tmp_password ? `Your temporary password : ${tmp_password}` : 'You can login your previous account password')
    );

    // if (user && user.role !== '4') {
    //     // ----------increment add teacher-------------
    //     await Access_comments.updateOne({ user: userId }, { $inc: { added_member: 1 } });
    // }

    // ----------increment add teacher-------------
    await Access_comments.updateOne({ user: userId }, { $inc: { added_member: 1 } });

    return user;
};


//accept school teacher invittation
const acceptInvitation_schoolTeacher = async (token: string) => {
    const decoded = verifyToken(token, config.jwt_access_secret as string);

    const user = await User.findById(decoded?.userId);

    if (!user) {
        throw new AppError(httpStatus.BAD_REQUEST, 'You Have not any invitation for a school teacher');
    }

    // return user if he already accepted
    if (user?.role === '4' && user?.accept_invitation) {
        return user;
    }

    else {
        await User.updateOne({ _id: decoded?.userId }, { accept_invitation: true, role: "4", isverified: true })
    }

}

//accept school teacher invittation
const acceptSubadmin_Invitation = async (token: string) => {
    const decoded = verifyToken(token, config.jwt_access_secret as string);

    const user = await User.findById(decoded?.userId);

    if (!user) {
        throw new AppError(httpStatus.BAD_REQUEST, 'You Have not any invitation for a school teacher');
    }

    // return user if he already accepted
    if (user?.role === '6' && user?.accept_invitation) {
        return user;
    }

    else {
        await User.updateOne({ _id: decoded?.userId }, { accept_invitation: true })
    }
}

//my school teachers
const mySchoolTeachers = async (query: Record<string, any>, userId: string) => {
    const userModel = new QueryBuilder(User.find({ school_admin: userId, isDeleted: false }), query) //accept_invitation: true
        .search(['name', 'email', 'contact', 'school'])
        .filter()
        .paginate()
        .sort();
    const data: any = await userModel.modelQuery;
    const meta = await userModel.countTotal();

    // const invitedUserCount = await User.countDocuments({ role: "4", school_admin: userId })
    const addLimit = await Access_comments.findOne({ user: userId });

    return {
        data,
        meta,
        addLimit: addLimit?.member_limit,
        invitedUserCount: addLimit?.added_member
    };
    // return await User.find({ $or: [ { name: /sss/i } ] })
}

//delete a school teacher
const deleteSchool_teacher = async (id: string, userId: string) => {

    const isExist = await User.findById(id);

    if (!isExist) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'Teacher not found',
        );
    }

    if (isExist?.school_admin !== (userId)) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'Teacher is not your school',
        );
    }

    const deleted = await User.updateOne({ _id: id }, { isDeleted: true, school_admin: '', accept_invitation : false });

    // ----------increment add teacher-------------
    await Access_comments.updateOne({ user: userId }, { $inc: { added_member: -1 } });

    return deleted
}

//adTeacher
const updateSchoolTeacher = async (payload: { name: string, status: 0 | 1 }, id: string, userId: string) => {

    const isExist = await User.findOne({ _id: id, role: '4' });

    //check teacher is exist or not
    if (!isExist) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'Teacher not found',
        );
    }

    if (isExist.school_admin !== (userId)) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'You are not his school admin',
        );
    }


    const user = await User.updateOne({ _id: id }, { name: payload.name, status: payload?.status });

    if (user?.modifiedCount <= 0) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Teacher update failed');
    }

    return user;
};

//user status update
const status_update_user = async (payload: { status: boolean }, id: string) => {

    const result = await User.updateOne({ _id: id }, { status: payload?.status })

    return result
}

//  add a new admin
const addSubAdmin = async (payload: IUser) => {
    const { name, email, password } = payload

    let isExist = await User.findOne({ email })

    //check user is exist or not
    if (isExist) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'Another account founded with this email',
        );
    }

    // creat encrypted password
    const hashedPassword = await bcrypt.hash(password, 15);

    const user = await User.create({ email, name, password: hashedPassword, role: '6' });

    if (!user) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Sub Admin creation failed');
    }

    const EmailPath = path.join(
        __dirname,
        '../../public/view/admin_invitation.html',
    );

    const jwtPayload: { userId: string; role: string } = {
        userId: user?._id?.toString() as string,
        role: user?.role,
    };

    const token = createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        60 * 60 * 24 * 7, //7 days
    );

    await sendEmail(
        payload?.email,
        'Subadmin invitation email',
        fs
            .readFileSync(EmailPath, 'utf8')
            .replace('{{url}}', (config.SERVER_URL + `/users/acceptadmininvitation/${token}`))
    );

    return user;
}


//  get all new admin
const allSubAdmins = async () => {

    const users = await User.find({ role: '6' });

    return users;
}


//  delete sub admin
const deleteSubAdmin = async (id: string) => {

    let isExist = await User.findOne({ _id: id, role: '6' })

    //check user is exist or not
    if (!isExist) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'Sub Admin not found',
        );
    }

    const res = await User.deleteOne({ _id: id });

    return res;
}



export const userService = {
    updateProfile,
    getUserById,
    allUsers,
    addTeacher,
    acceptInvitation_schoolTeacher,
    deleteSchool_teacher,
    mySchoolTeachers,
    status_update_user,
    updateSchoolTeacher,
    addSubAdmin,
    deleteSubAdmin,
    allSubAdmins,
    acceptSubadmin_Invitation
}