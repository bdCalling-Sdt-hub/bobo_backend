import { Router } from "express";
import { authController } from "./auth.controller";
import { changePasswordValidator, createAccountValidator, forgotPasswordValidator, guestUserCreateValidator, loginAccountValidator, refreshTokenValidator, resetPasswordValidator, sendAdminRegisterEmailValidator } from "./auth.validator";
import req_validator from "../../middleware/req_validation";
import { otpResendValidator, otpVerifyValidator } from "../otp/otp.validation";
import { otpControllers } from "../otp/otp.controller";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constants";

const router = Router();

router.post('/create',
    createAccountValidator,
    req_validator(),
    authController.createUser
)

router.post('/create-guest',
    guestUserCreateValidator,
    req_validator(),
    authController.createGuestUser
)

router.post('/login',
    loginAccountValidator,
    req_validator(),
    authController.loginUser
)

router.post('/admin/login',
    loginAccountValidator,
    req_validator(),
    authController.adminLogin
)

router.patch(
    '/change-password',
    changePasswordValidator,
    req_validator(),
    auth(USER_ROLE.individual_teacher, USER_ROLE.school_admin, USER_ROLE.school_teacher, USER_ROLE.admin, USER_ROLE.sub_admin),
    authController.changePassword,
);

router.post('/refresh',
    refreshTokenValidator,
    req_validator(),
    authController.refreshToken
)

router.post(
    '/verify-otp',
    otpVerifyValidator,
    req_validator(),
    otpControllers.verifyOtp,
);

router.post(
    '/resend-otp',
    otpResendValidator,
    req_validator(),
    otpControllers.resendOtp,
);

router.post(
    '/admin-register-email',
    sendAdminRegisterEmailValidator,
    req_validator(),
    authController.sendEmailRegisterForm,
);

router.post('/forgot-password', forgotPasswordValidator, req_validator(), authController.forgotPassword);
router.patch('/reset-password', resetPasswordValidator, req_validator(), authController.resetPassword);

export const authRouts = router