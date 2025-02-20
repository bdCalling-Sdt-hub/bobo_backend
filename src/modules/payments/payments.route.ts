import { Router } from 'express';
import { paymentsController } from './payments.controller';
import { USER_ROLE } from '../user/user.constants';
import auth from '../../middleware/auth';
import { checkoutValidator } from './payments.validation';
import req_validator from '../../middleware/req_validation';

const router = Router();

router.post('/checkout', checkoutValidator, req_validator(), auth(USER_ROLE.guest_user, USER_ROLE?.individual_teacher, USER_ROLE.school_admin, USER_ROLE.school_teacher), paymentsController.checkout);

router.get(
  '/userpayment',
  auth(USER_ROLE.school_admin),
  paymentsController.getPaymentsByUserId,
);

router.get(
  '/paymentbyuserId/:id',
  auth(USER_ROLE.school_admin),
  paymentsController.getPaymentsByUserIdWithParams,
);



router.get('/confirm-payment', paymentsController.confirmPayment);

router.patch('/:id', auth(USER_ROLE.school_admin), paymentsController.updatePayments);

router.delete('/:id', auth(USER_ROLE.school_admin), paymentsController.deletePayments);

router.get(
  '/:id',
  auth(USER_ROLE.school_admin, USER_ROLE.school_admin),
  paymentsController.getPaymentsById,
);

router.get('/', auth(USER_ROLE.school_admin), paymentsController.getAllPayments);

export const paymentsRoutes = router;
