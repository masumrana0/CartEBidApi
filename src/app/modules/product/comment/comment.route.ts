import express from 'express';
import { productCommentController } from './comment.controller';
import { ENUM_USER_ROLE } from '../../../../enums/role';
import auth from '../../../middlewares/auth';

const router = express.Router();

// Create a comment for a product
router.post(
  '/',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.CUSTOMER,
  ),
  productCommentController.createComment,
);

// Get all comments for a specific product
router.get('/:id', productCommentController.getComments);

// Delete a specific comment
router.delete(
  '/:id',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.CUSTOMER,
  ),
  productCommentController.deleteComment,
);

export const productCommentRoute = router;
