import { check } from "express-validator";

export const createContactValidator = [
  check('fullname').trim().escape().not().isEmpty().withMessage('fullname is required').isString(),
  check('email').trim().escape().not().isEmpty().withMessage('Email is required').isEmail().normalizeEmail({ all_lowercase: true }).withMessage('Invalid Email'),
  check('description').trim().escape().not().isEmpty().withMessage('description is required').isString(),
]

