import { check } from "express-validator";

export const subscriptionValidator = [
    check('package').trim().escape().not().isEmpty().withMessage('package is required')
]