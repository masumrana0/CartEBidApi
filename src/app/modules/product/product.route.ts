import express from 'express';
import { FileUploadHelper } from '../../../helper/FileUploadHelper';
import { productController } from './product.controller';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/role';

const router = express.Router();

// Create Product
router.post(
  '/',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.CUSTOMER,
  ),
  FileUploadHelper.upload.fields([
    { name: 'mainPhoto', maxCount: 1 },
    { name: 'others', maxCount: 20 },
    { name: 'docs', maxCount: 10 },
  ]),
  productController.createProduct,
);

// Get all products
router.get('/', productController.getAllProducts);

// Get product by ID
router.get('/:id', productController.getProductById);

// Update product
router.patch(
  '/:id',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.CUSTOMER,
  ),
  productController.updateProduct,
);

// Delete product
router.delete(
  '/:id',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.CUSTOMER,
  ),
  productController.deleteProduct,
);

export const productRoute = router;
