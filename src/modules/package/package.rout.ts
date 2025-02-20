import { Router } from "express";
import { addPackageValidator, getPackageValidator } from "./package.validator";
import req_validator from "../../middleware/req_validation";
import { packageControler } from "./package.controller";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constants";
const router = Router();

router.post('/',
    addPackageValidator,
    req_validator(),
    auth(USER_ROLE.sub_admin, USER_ROLE.admin),
    packageControler.createPackage
)
router.patch('/:id',
    addPackageValidator,
    req_validator(),
    auth(USER_ROLE.sub_admin, USER_ROLE.admin),
    packageControler.updatePackage
)

router.get('/',
    getPackageValidator,
    req_validator(),
    packageControler.getPackages_by_type
)

export const packageRouts = router