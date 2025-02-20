import { check } from 'express-validator';

export const createAccountValidator = [
    check('name').trim().escape().not().isEmpty().withMessage('Name is required').isString().isLength({ min: 2 }).withMessage('Name min length is 2'),
    check('email').trim().escape().not().isEmpty().withMessage('Email is required').isEmail().normalizeEmail({ all_lowercase: true }).withMessage('Invalid Email'),
    check('contact').optional().trim().escape(), //.isMobilePhone('any').withMessage('Invalid contact number')
    check('job_role').optional().trim().escape().isString(),
    check('school').optional().trim().escape().isString(),
    check('password').trim().escape().not().isEmpty().withMessage('password is required').isString(),
    check('role').optional().trim().escape().isNumeric().withMessage('invalid role format').isIn(['2', '3', '4']).withMessage('invalid role'),
]

export const loginAccountValidator = [
    check('email').trim().escape().not().isEmpty().withMessage('Email is required').isEmail().normalizeEmail({ all_lowercase: true }).withMessage('Invalid Email'),
    check('password').trim().escape().not().isEmpty().withMessage('password is required').isString(),
]

export const refreshTokenValidator = [
    check('refreshToken').trim().escape().not().isEmpty().withMessage('refreshToken is required').isString(),
]

export const forgotPasswordValidator = [
    check('email').trim().escape().not().isEmpty().withMessage('Email is required').isEmail().normalizeEmail({ all_lowercase: true }).withMessage('Invalid Email'),
]

export const resetPasswordValidator = [
    check('newPassword').trim().escape().not().isEmpty().withMessage('newPassword is required'),
    check('confirmPassword').trim().escape().not().isEmpty().withMessage('confirmPassword is required'),
]

export const guestUserCreateValidator = [
    check('email').trim().escape().not().isEmpty().withMessage('Email is required').isEmail().normalizeEmail({ all_lowercase: true }).withMessage('Invalid Email'),
]

export const changePasswordValidator = [
    check('oldPassword').trim().escape().not().isEmpty().withMessage('oldPassword is required').isString(),
    check('newPassword').trim().escape().not().isEmpty().withMessage('newPassword is required').isString(),
    check('confirmPassword').trim().escape().not().isEmpty().withMessage('confirmPassword is required').isString(),
]

export const sendAdminRegisterEmailValidator = [
    check('firstName').trim().escape().not().isEmpty().withMessage('firstName is required').isString().isLength({ min: 2 }).withMessage('firstName min length is 2'),
    check('lastName').trim().escape().not().isEmpty().withMessage('lastName is required').isString().isLength({ min: 2 }).withMessage('lastName min length is 2'),
    check('email').trim().escape().not().isEmpty().withMessage('Email is required').isEmail().normalizeEmail({ all_lowercase: true }).withMessage('Invalid Email'),
]