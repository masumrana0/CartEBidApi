/**
 * Title: 'Customer Authentication router'
 * Description: 'set authentication router'
 * Author: 'Masum Rana'
 * Date: 29-12-2023
 *
 */

import express from 'express';
import { CustomerController } from './customer.controller';
const router = express.Router();

router.post(
  '/register',
  // validateRequest(authValidationSchema.customerRegisterZodSchema),
  CustomerController.customerRegistration,
);

export const CustomerthRoutes = router;
