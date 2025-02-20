
import { Router } from "express";
import req_validator from "../../middleware/req_validation";
import { access_comments_controller } from "./access_comments.controller";
import { commentGenerateValidator } from "./access_comments.validator";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constants";

const router = Router();

router.post('/generateFeedback',
    commentGenerateValidator,
    req_validator(),
    auth(USER_ROLE.guest_user, USER_ROLE.individual_teacher, USER_ROLE.school_admin, USER_ROLE.school_teacher),
    access_comments_controller.generate_comment)

// router.get('/all',

//     access_comments_controller.getSubscriptionWithExpired_by_7days)

export const commentRouts = router
