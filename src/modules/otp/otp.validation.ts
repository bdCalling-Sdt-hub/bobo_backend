import { check, header } from "express-validator";

export const otpVerifyValidator = [
    header('token').trim().escape().not().isEmpty().withMessage('token is not found in header').isString(),
    check('otp').trim().escape().not().isEmpty().withMessage('otp token is required').isString()
]
export const otpResendValidator = [
    check('email').trim().escape().not().isEmpty().withMessage('Email is required').isEmail().normalizeEmail({ all_lowercase: true }).withMessage('Invalid Email'),
]