import { Router } from "express";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constants";
import { apiKeyControler } from "./apiKey.controler";
import { check } from "express-validator";
import req_validator from "../../middleware/req_validation";

const router = Router();

export const apiKeyValidator = [
    check('key').trim().not().isEmpty().withMessage('api key is required')
]
router.get('/', auth(USER_ROLE.admin, USER_ROLE.sub_admin), apiKeyControler.getOpenAi_key);

router.patch('/', apiKeyValidator, req_validator(), auth(USER_ROLE.admin, USER_ROLE.sub_admin), apiKeyControler.updateOpenAi_key);

export const open_api_routs = router;