import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import moment from 'moment';
import { sendEmail } from '../../utils/mailSender';
import config from '../../config';
import { User } from '../user/user.models';
import fs from 'fs';
import path from 'path';
import { generateOtp } from '../../utils/otpGenerator';

const verifyOtp = async (token: string, otp: string | number) => {

  if (!token) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized');
  }
  let decode;
 
  try {
    decode = jwt.verify(
      token,
      config.jwt_access_secret as Secret,
    ) as JwtPayload;
  } catch (err) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Session has expired. Please try to submit OTP within 3 minute',
    );
  }

  const user = await User.findById(decode?.userId).select(
    'verification status ',
  );

  if (!user) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User not found');
  }
  if (new Date() > user?.verification?.expiresAt) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'OTP has expired. Please resend it',
    );
  }

  if (user?.verification?.status) {
    throw new AppError(httpStatus.BAD_REQUEST, 'You already verified, need to login');
  }

  if (Number(otp) !== Number(user?.verification?.otp)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'OTP did not match');
  }

  const  updateUser = await User.findByIdAndUpdate(
    user?._id,
    {
      $set: {
        verification: {
          otp: 0,
          expiresAt: moment().add(3, 'minute'),
          status: true,
        },
        isverified: true
      },
    },
    { new: true },
  ).select('email _id name role');

  const jwtPayload = {
    email: updateUser?.email,
    role: updateUser?.role,
    userId: updateUser?._id,
  };

  const jwtToken = jwt.sign(jwtPayload, config.jwt_access_secret as Secret, {
    expiresIn: '30d',
  });

  return { user: updateUser, accessToken: jwtToken };
};

const resendOtp = async (email: string) => {
  const user = await User.findOne({ email })

  if (!user) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User not found');
  }

  const otp = generateOtp();
  const expiresAt = moment().add(3, 'minute');

  const updateOtp = await User.findByIdAndUpdate(
      user?._id,
      {
        $set: {
          verification: {
            otp,
            expiresAt,
            status: false,
          },
        },
      },
      { new: true },
    );

  if (!updateOtp) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Failed to resend OTP. Please try again later',
    );
  }

  const jwtPayload = {
    email: user?.email,
    userId: user?._id,
    role: user?.role
  };
  const token = jwt.sign(jwtPayload, config.jwt_access_secret as Secret, {
    expiresIn: '3m',
  });

  const otpEmailPath = path.join(
    __dirname,
    '../../public/view/otp_mail.html',
  );

  if (user) {
    await sendEmail(
      user?.email,
      'Your One Time OTP',
      fs
        .readFileSync(otpEmailPath, 'utf8')
        .replace('{{otp}}', otp)
        .replace('{{email}}', user?.email),
    );
  }

  return { token };
};

export const otpServices = {
  verifyOtp,
  resendOtp,
};
