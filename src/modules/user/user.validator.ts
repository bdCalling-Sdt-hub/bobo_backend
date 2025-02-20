import { check, param } from "express-validator";

export const addSchoolTeacherValidator = [
    check('firstName').trim().escape().not().isEmpty().withMessage('firstName is required').isString().isLength({ min: 2 }).withMessage('firstName min length is 2'),
    check('lastName').trim().escape().not().isEmpty().withMessage('lastName is required').isString().isLength({ min: 2 }).withMessage('lastName min length is 2'),
    check('email').trim().escape().not().isEmpty().withMessage('Email is required').isEmail().normalizeEmail({ all_lowercase: true }).withMessage('Invalid Email'),
    check('password').trim().escape().not().isEmpty().withMessage('password is required').isString(),
]

export const updateSchoolTeacherValidator = [
    check('name').trim().escape().not().isEmpty().withMessage('name is required').isString().isLength({ min: 2 }).withMessage('name min length is 2'),
    check('status').trim().escape().not().isEmpty().withMessage('status is required').isBoolean().withMessage("status must be boolean"),
]

export const statusUpdateValidator = [
    check('status').trim().escape().not().isEmpty().withMessage('status is required').isBoolean().withMessage("status must be boolean"),
]

export const addAdminValidator = [
    check('name').trim().escape().not().isEmpty().withMessage('Name is required').isString().isLength({ min: 2 }).withMessage('Name min length is 2'),
    check('email').trim().escape().not().isEmpty().withMessage('Email is required').isEmail().normalizeEmail({ all_lowercase: true }).withMessage('Invalid Email'),
    check('password').trim().escape().not().isEmpty().withMessage('password is required').isString(),
]