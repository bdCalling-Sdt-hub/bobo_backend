import { check, query } from "express-validator";

export const addPackageValidator = [
    check('shortTitle').trim().escape().not().isEmpty().withMessage('shortTitle is required').isString().isLength({ min: 2 }).withMessage('shortTitle min length is 2'),
    check('shortDescription').trim().escape().not().isEmpty().withMessage('shortDescription is required').isString().isLength({ min: 2 }).withMessage('shortDescription min length is 2'),
    check('comment_limit').trim().escape().not().isEmpty().withMessage('comment limit is required').isNumeric().withMessage('invalid comment_limit format'),
    check('duration').trim().escape().not().isEmpty().withMessage('duration day is required').isNumeric().withMessage('invalid duration format'),
    check('plan_type').trim().escape().not().isEmpty().isString().withMessage('plan_type is required'),
    check('price').trim().escape().not().isEmpty().withMessage('price is required').isNumeric().withMessage('invalid price format'),
]

export const getPackageValidator = [
    query('type').optional().trim().escape().isString().isIn(['standard', 'premium']).withMessage("filter type is invalid"),
]