import { Router } from 'express';
import { otpControllers } from './otp.controller';
import { otpResendValidator, otpVerifyValidator } from './otp.validation';
import req_validator from '../../middleware/req_validation';
const router = Router();



export const otpRoutes = router;
