import { Request, Response } from "express"
import { IUser } from "../user/user.interface"
import AppError from "../../error/AppError"
import httpStatus from 'http-status'
import bcrypt from 'bcrypt'
import { User } from "../user/user.models"
import { createToken, verifyToken } from "./auth.utils"
import config from "../../config"
import path from 'path';
import fs from 'fs';
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import { generateOtp } from "../../utils/otpGenerator"
import moment from "moment"
import { sendEmail } from "../../utils/mailSender"
import Access_comments from "../access_comments/access_comments.model"

const createUser = async (payload: IUser) => {
    const { name, email, password, contact = '', job_role = "", school = '', role = "1", school_admin } = payload

    let isExist = await User.findOne({ email, role: { $ne: '1' } })

    //check user is exist or not
    if (isExist) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'User already exists with this email',
        );
    }

    // creat encrypted password
    const hashedPassword = await bcrypt.hash(password, 15);

    const user = await User.findOneAndUpdate({ email }, { name, email, contact, password: hashedPassword, job_role, school, role, school_admin }, { upsert: true, new: true });

    if (!user) {
        throw new AppError(httpStatus.BAD_REQUEST, 'User creation failed');
    }

    await Access_comments.findOneAndUpdate(
        { user: user?._id },
        {
            $set: { [`plans.free.expiredAt`]: null, [`plans.free.comment_generated`]: 0, [`plans.free.comment_generate_limit`]: 5, [`plans.free.accessCycle`]: 'all', user: user?._id },
        },
        { upsert: true },
    );

    return user;
}

//create Guest user
const createGuestUser = async (payload: { email: string }) => {
    const { email } = payload

    // const isExist = await GuestUser.findOne({ $or: [{ email }, { $and: [{ device }, { ip }] }] });
    const isExist = await User.findOne({ email });

    //check user is exist or not
    if (isExist) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'User already exists',
        );
    }

    const user = await User.create({ email, role: '1' });

    await Access_comments.findOneAndUpdate(
        { user: user?._id },
        {
            $set: { [`plans.free.expiredAt`]: null, [`plans.free.comment_generated`]: 0, [`plans.free.comment_generate_limit`]: 5, [`plans.free.accessCycle`]: 'all', user: user?._id },
        },
        { upsert: true },
    );


    if (!user) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Guest User creation failed');
    }

    return user;
}

// Login
const loginUser = async (payload: { email: string, password: string }) => {

    const user: IUser | null = await User.findOne({ email: payload?.email, role: { $ne: '5' } });

    if (!user) {
        // If user not found, throw error
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    } else {
        if (!user?.status) {
            throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked');
        }


        // Handle verify password
        const passwordMatched = await bcrypt.compare(payload?.password, user?.password);

        if (!passwordMatched) {
            throw new AppError(httpStatus.BAD_REQUEST, 'Password does not match');
        }


        if (!user?.isverified) {
            throw new AppError(httpStatus.BAD_REQUEST, 'Your account is not verified');
        }

    }

    const jwtPayload: { userId: string; role: string } = {
        userId: user?._id?.toString() as string,
        role: user?.role,
    };

    const accessToken = createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        60 * 60 * 24 * 30, //30 days
    );

    const refreshToken = createToken(
        jwtPayload,
        config.jwt_refresh_secret as string,
        60 * 60 * 24 * 365,
    );

    return {
        user,
        accessToken,
        refreshToken,
    };
};

//admin login
const adminLogin = async (payload: { email: string, password: string }) => {

    const user: IUser | null = await User.findOne({ email: payload?.email, role: { $in: ['5', '6'] } });

    if (!user) {
        // If user not found, throw error
        throw new AppError(httpStatus.NOT_FOUND, 'admin not found');
    } else {
        if (user?.isDeleted) {
            throw new AppError(httpStatus.FORBIDDEN, 'Admin not found');
        }


        // Handle verify password
        const passwordMatched = await bcrypt.compare(payload?.password, user?.password);

        if (!passwordMatched) {
            throw new AppError(httpStatus.BAD_REQUEST, 'Password does not match');
        }


        if (!user?.isverified) {
            throw new AppError(httpStatus.FORBIDDEN, 'Your account is not verified');
        }

    }

    const jwtPayload: { userId: string; role: string } = {
        userId: user?._id?.toString() as string,
        role: user?.role,
    };

    const accessToken = createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        60 * 60 * 24 * 30, //30 days
    );

    const refreshToken = createToken(
        jwtPayload,
        config.jwt_refresh_secret as string,
        60 * 60 * 24 * 365,
    );

    return {
        user,
        accessToken,
        refreshToken,
    };
};


// Change password
const changePassword = async (id: string, payload: { oldPassword: string, newPassword: string, confirmPassword: string }) => {
    const user = await User.findById(id);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    const passwordMatched = await bcrypt.compare(payload?.oldPassword, user?.password);

    if (!passwordMatched) {
        throw new AppError(httpStatus.FORBIDDEN, 'Old password does not match');
    }
    if (payload?.newPassword !== payload?.confirmPassword) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'New password and confirm password do not match',
        );
    }

    const hashedPassword = await bcrypt.hash(
        payload?.newPassword,
        Number(config.bcrypt_salt_rounds),
    );

    const result = await User.findByIdAndUpdate(
        id,
        {
            $set: {
                password: hashedPassword,
                passwordChangedAt: new Date(),
            },
        }
    );

    return result;
};


// Forgot password
const forgotPassword = async (email: string) => {
    const user = await User.findOne({ email });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    const jwtPayload = {
        email: email,
        userId: user?._id,
    };

    const token = jwt.sign(jwtPayload, config.jwt_access_secret as Secret, {
        expiresIn: '3m',
    });

    const currentTime = new Date();
    const otp = generateOtp();
    const expiresAt = moment(currentTime).add(3, 'minute');

    await User.findByIdAndUpdate(user?._id, {
        verification: {
            otp,
            expiresAt,
        },
    });

    const otpEmailPath = path.join(
        __dirname,
        '../../public/view/forgot_pass_mail.html',
    );

    await sendEmail(
        user?.email,
        'Your reset password OTP is',
        fs
            .readFileSync(otpEmailPath, 'utf8')
            .replace('{{otp}}', otp)
            .replace('{{email}}', user?.email),
    );

    // await sendEmail(
    //   email,
    //   'Your reset password OTP is:',
    //   `<div><h5>Your OTP is: ${otp}</h5>
    //   <p>Valid until: ${expiresAt.toLocaleString()}</p>
    //   </div>`,
    // );

    return { email, token };
};


// Reset password
const resetPassword = async (token: string, payload: { newPassword: string, confirmPassword: string }) => {
    let decode;
    try {
        decode = jwt.verify(
            token,
            config.jwt_access_secret as string,
        ) as JwtPayload;
    } catch (err) {
        throw new AppError(
            httpStatus.UNAUTHORIZED,
            'Session has expired. Please try again',
        );
    }

    const user: IUser | null = await User.findById(decode?.userId).select(
        'verification',
    );

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }
    if (new Date() > user?.verification?.expiresAt) {
        throw new AppError(httpStatus.FORBIDDEN, 'Session has expired');
    }
    if (!user?.verification?.status) {
        throw new AppError(httpStatus.FORBIDDEN, 'OTP is not verified yet');
    }
    if (payload?.newPassword !== payload?.confirmPassword) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'New password and confirm password do not match',
        );
    }

    const hashedPassword = await bcrypt.hash(
        payload?.newPassword,
        Number(config.bcrypt_salt_rounds),
    );

    const result = await User.findByIdAndUpdate(decode?.userId, {
        password: hashedPassword,
        verification: {
            otp: 0,
            status: true,
        },
    });

    return result;
};


// Refresh token
const refreshToken = async (token: string) => {
    // Checking if the given token is valid
    const decoded = verifyToken(token, config.jwt_refresh_secret as string);
    const { userId } = decoded;
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }
    // const isDeleted = user?.isDeleted;

    // if (isDeleted) {
    //   throw new AppError(httpStatus.FORBIDDEN, 'This user is deleted');
    // }

    const jwtPayload = {
        userId: user?._id?.toString() as string,
        role: user.role,
    };

    const accessToken = createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        60 * 60 * 24 * 30,
    );

    const refreshToken = createToken(
        jwtPayload,
        config.jwt_refresh_secret as string,
        60 * 60 * 24 * 365,
    );

    return {
        accessToken,
        refreshToken
    };
};

// Forgot password
const sendEmailRegisterForm = async (email: string, firstName: string, lastName: string) => {

    const otpEmailPath = path.join(
        __dirname,
        '../../public/view/form_link_send.html',
    );

    await sendEmail(
        email,
        'Teacher Register form link',
        fs
            .readFileSync(otpEmailPath, 'utf8')
            .replace('{{link}}', (config.client_Url + '/fr/schoolAccountAuth/schoolRegister'))
            .replace('{{firstName}}', firstName)
            .replace('{{lastName}}', lastName)
    );

    // await sendEmail(
    //   email,
    //   'Your reset password OTP is:',
    //   `<div><h5>Your OTP is: ${otp}</h5>
    //   <p>Valid until: ${expiresAt.toLocaleString()}</p>
    //   </div>`,
    // );

    return
};

export const authService = {
    createUser,
    createGuestUser,
    loginUser,
    forgotPassword,
    changePassword,
    resetPassword,
    refreshToken,
    sendEmailRegisterForm,
    adminLogin
}