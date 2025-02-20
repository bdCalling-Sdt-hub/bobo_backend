
import { Router } from "express";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constants";
import { dashboardControler } from "./dashboard.controler";

const router = Router();

router.get('/userChart', auth(USER_ROLE.admin, USER_ROLE.sub_admin), dashboardControler.userChart);

router.get('/earningChart', auth(USER_ROLE.admin, USER_ROLE.sub_admin), dashboardControler.earningChart);

router.get('/count', auth(USER_ROLE.admin, USER_ROLE.sub_admin), dashboardControler.countData);

export const dashboardRouts = router