import { Router } from "express";
import multer, { memoryStorage } from "multer";
import auth from "../../middleware/auth";
import { USER_ROLE } from "./user.constants";
import parseData from "../../middleware/parseData";
import { userController } from "./user.controller";
import { addAdminValidator, addSchoolTeacherValidator, statusUpdateValidator, updateSchoolTeacherValidator } from "./user.validator";
import req_validator from "../../middleware/req_validation";

const router = Router();
const storage = memoryStorage();

const single_image_Upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 3 /* 3 mb */ },
    fileFilter(req, file, cb) {
        // if file type valid
        if (['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.mimetype)) {
            cb(null, true)
        }
        else {
            cb(null, false);
            return cb(new Error('file type is not allowed'))
        }
    },
}).single('image');


router.get(
    '/',
    auth(USER_ROLE.admin, USER_ROLE.sub_admin),
    userController.all_users,
);

router.patch(
    '/status/:id',
    statusUpdateValidator,
    req_validator(),
    auth(USER_ROLE.admin, USER_ROLE.sub_admin),
    userController.update_user_status,
);


router.patch(
    '/update-my-profile',
    auth(USER_ROLE.individual_teacher, USER_ROLE.school_admin, USER_ROLE.school_teacher, USER_ROLE.admin, USER_ROLE.sub_admin),
    single_image_Upload,
    parseData(),
    userController.updateProfile,
);


router.get(
    '/my-profile',
    auth(USER_ROLE.guest_user, USER_ROLE.individual_teacher, USER_ROLE.school_admin, USER_ROLE.school_teacher, USER_ROLE.admin, USER_ROLE.sub_admin),
    userController.getMyProfile,
);

router.post(
    '/add-school-teacher',
    addSchoolTeacherValidator,
    req_validator(),
    auth(USER_ROLE.school_admin),
    userController.addTeacher,
);

router.put(
    '/update-school-teacher/:id',
    updateSchoolTeacherValidator,
    req_validator(),
    auth(USER_ROLE.school_admin),
    userController.updateTeacherById,
);

router.delete(
    '/school-teacher/:id',
    req_validator(),
    auth(USER_ROLE.school_admin),
    userController.deleteSchoolTeacher,
);

router.get(
    '/school-teachers',
    auth(USER_ROLE.school_admin),
    userController.mySchoolTeachers,
);

// --------------school teachers by school admin-------------
router.get(
    '/school-teachers/:id',
    auth(USER_ROLE.school_admin, USER_ROLE.admin),
    userController.SchoolTeachers,
);


router.get(
    '/subadmin',
    auth(USER_ROLE.admin, USER_ROLE.sub_admin),
    userController.allSubAdmins,
);

router.post(
    '/subadmin',
    addAdminValidator,
    req_validator(),
    auth(USER_ROLE.admin),
    userController.addSubAdmin,
);

router.delete(
    '/subadmin/:id',
    auth(USER_ROLE.admin),
    userController.deleteSubAdmin,
);

export const userRoutes = router;