import { check } from "express-validator";

export const subscriptionValidator = [
    check('package').trim().escape().not().isEmpty().withMessage('package is required'),
    check('member').trim().escape().not().isEmpty().withMessage('member is required').isNumeric().withMessage("memeber need to number")
]