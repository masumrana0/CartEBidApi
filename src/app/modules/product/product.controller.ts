import { Request, Response } from 'express';
import { Express } from 'express';
import httpStatus from 'http-status';
import { productService } from './product.service'; // Adjust import path as needed
import catchAsync from '../../../shared/catchAsync';
import sendResponse, { IGenericResponse } from '../../../shared/sendResponse';
import { IProduct, IProductFilterableField } from './product.interface';
import { IUploadFile } from '../../../inerfaces/file';
import pick from '../../../shared/pick';
import { paginationFields } from '../../../constant/pagination';
import { productFilterableFields } from './product.constant';

// Create Product
const createProduct = catchAsync(async (req: Request, res: Response) => {
  const productData = JSON.parse(req.body.data);

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  // Flatten the files object into an array with fieldname property
  const flattenedFiles = Object.entries(files).reduce(
    (acc, [fieldname, fieldFiles]) => {
      return [...acc, ...fieldFiles.map(file => ({ ...file, fieldname }))];
    },
    [] as IUploadFile[],
  );

  const result = await productService.createProduct(
    productData,
    flattenedFiles,
  );

  sendResponse<IProduct>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product created successfully!',
    data: result,
  });
});

// Get all products
const getAllProducts = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const paginationOption = pick(query, paginationFields);
  const filters = pick(
    query,
    productFilterableFields,
  ) as IProductFilterableField;

  const result = await productService.getAllProducts(paginationOption, filters);
  sendResponse<IGenericResponse<IProduct[]>>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Products fetched successfully!',
    data: result,
  });
});

// Get product by ID
const getProductById = catchAsync(async (req: Request, res: Response) => {
  const productId = req.params.id;

  const result = await productService.getProductById(productId);
  if (!result) {
    return sendResponse<null>(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Product not found',
      data: null,
    });
  }

  sendResponse<IProduct>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product fetched successfully!',
    data: result,
  });
});

// Update product
const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const productId = req.params.id;
  const { ...productData } = req.body;

  const result = await productService.updateProduct(productId, productData);
  if (!result) {
    return sendResponse<null>(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Product not found',
      data: null,
    });
  }

  sendResponse<IProduct>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product updated successfully!',
    data: result,
  });
});

// Delete product
const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const productId = req.params.id;

  const result = await productService.deleteProduct(productId);
  if (!result) {
    return sendResponse<null>(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Product not found',
      data: null,
    });
  }

  sendResponse<IProduct>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product deleted successfully!',
    data: result,
  });
});

export const productController = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
