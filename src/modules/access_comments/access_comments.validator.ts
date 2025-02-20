import { check } from "express-validator";

export const commentGenerateValidator = [
    check('feedbackData').not().isEmpty().withMessage('feedbackData is required'),
    check('language').trim().not().isEmpty().withMessage('language is required'),
    check('cycle').trim().not().isEmpty().withMessage('cycle is required').isIn(['1', '2', '3']).withMessage('invalid cycle'),
]