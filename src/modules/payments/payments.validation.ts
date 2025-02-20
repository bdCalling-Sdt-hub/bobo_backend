import { check } from "express-validator";

export const checkoutValidator = [
    check('subscription').trim().escape().not().isEmpty().withMessage('subscription is required')
]