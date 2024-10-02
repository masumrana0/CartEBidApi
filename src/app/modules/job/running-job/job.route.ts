import express from 'express';
import { RunningJobController } from './job.controller';
import auth from '../../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../../enums/role';

const router = express.Router();

router.get('/', RunningJobController.getAllRunningJob);
router.get(
  '/our-job',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.CUSTOMER,
    ENUM_USER_ROLE.SUPER_ADMIN,
  ),
  RunningJobController.getSpecificUserRunningJob,
);
router.get('/:id', RunningJobController.getOneRunningJobById);

// router.delete(
//   '/:id',
//   auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
//    .deletePendingJobById,
// );

export const RunningJobRoutes = router;
