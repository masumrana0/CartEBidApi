import express from 'express';
import { FileUploadHelper } from '../../../helper/FileUploadHelper';
import { productController } from './product.controller';

const router = express.Router();

// Create Product
router.post(
  '/',
  // auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  FileUploadHelper.upload.array('files'),
  productController.createProduct,
);

// Get all products
router.get('/', productController.getAllProducts);

// Get product by ID
router.get(
  '/:id',

  productController.getProductById,
);

// Update product
router.patch(
  '/:id',
  // auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  productController.updateProduct,
);

// Delete product
router.delete(
  '/:id',
  // auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  productController.deleteProduct,
);

export const productRoute = router;
