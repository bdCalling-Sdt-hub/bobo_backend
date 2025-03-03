import { check } from "express-validator";

export const subscriptionValidator = [
    check('package').trim().escape().not().isEmpty().withMessage('package is required'),
    check('member').trim().escape().optional().isNumeric().withMessage("memeber need to number").isInt({ min: 1 }).withMessage("memeber must be getter then 0")
]