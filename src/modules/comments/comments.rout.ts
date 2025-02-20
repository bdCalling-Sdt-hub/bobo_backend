import { Router } from "express";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constants";
import { CommentControler } from "./comments.controler";

const router = Router();

router.get('/', auth(USER_ROLE.individual_teacher, USER_ROLE.school_admin, USER_ROLE.school_teacher), CommentControler.myGeneratedComments)

export const usercommentRouts = router