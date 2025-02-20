import { Router } from 'express';
import { contactController } from './contact.controller';
import { USER_ROLE } from '../user/user.constants';
import auth from '../../middleware/auth';
import { createContactValidator } from './contact.validation';
import req_validator from '../../middleware/req_validation';

const router = Router();

router.post(
  '/add',
  createContactValidator,
  req_validator(),
  contactController.createcontact,
);

// router.patch('/update/:id', contactController.updatecontact);

// router.delete('/:id', contactController.deletecontact);
// router.get('/user/:id', contactController.getcontactByUserId);
// router.get('/:id', contactController.getcontactById);
router.get('/',
  auth(USER_ROLE.admin, USER_ROLE.sub_admin),
  contactController.getAllcontact);

export const contactRoutes = router;
