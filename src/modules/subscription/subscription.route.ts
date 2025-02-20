import { Router } from 'express';
import { subscriptionController } from './subscription.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';
import { subscriptionValidator } from './subscription.validation';
import req_validator from '../../middleware/req_validation';


const router = Router();

router.post(
  '/',
  subscriptionValidator,
  req_validator(),
  auth(USER_ROLE.guest_user, USER_ROLE.individual_teacher, USER_ROLE.school_admin, USER_ROLE.school_teacher),
  subscriptionController.createSubscription,
);

router.get(
  '/my-subscription',
  auth(USER_ROLE.individual_teacher, USER_ROLE.school_admin, USER_ROLE.school_teacher),
  subscriptionController.my_running_subscriptions,
);

// router.patch(
//   '/:id',
//   auth(USER_ROLE.dealer),
//   subscriptionController.updateSubscription,
// );

// router.delete(
//   '/:id',
//   auth(USER_ROLE.admin),
//   subscriptionController.deleteSubscription,
// );

// router.get(
//   '/user/:userId',
//   auth(USER_ROLE.dealer, USER_ROLE.admin),
//   subscriptionController.getSubscriptionByUserId,
// );

// router.get(
//   '/my-subscriptions',
//   auth(USER_ROLE.dealer),
//   subscriptionController.getMySubscription,
// );

// router.get(
//   '/personalsubscription',
//   auth(USER_ROLE.dealer),
//   subscriptionController.getSubscriptionById,
// );

router.get(
  '/',
  auth(USER_ROLE.admin, USER_ROLE.sub_admin),
  subscriptionController.getAllSubscription,
);

export const subscriptionRoutes = router;
