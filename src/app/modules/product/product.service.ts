import { http } from 'winston';
import ApiError from '../../../errors/ApiError';
import { FileUploadHelper } from '../../../helper/FileUploadHelper';
import { IUploadFile } from '../../../inerfaces/file';
import { IProduct } from './product.interface';
import { Product } from './product.model';
import httpStatus from 'http-status';
// Create a new product
const createProduct = async (
  payload: IProduct,
  files: IUploadFile[],
): Promise<IProduct | null> => {
  const images = await FileUploadHelper.uploadMultipleToCloudinary(files);

  payload.photos.mainPhoto = images[0];
  payload.photos.others = images?.filter(
    (_: string, index: number) => index !== 0,
  );

  const result = await Product.create(payload);
  return result;
};

// Get one product by ID
const getProductById = async (id: string): Promise<IProduct | null> => {
  const result = await Product.findById(id);
  return result;
};

// Get all products
const getAllProducts = async (): Promise<IProduct[] | null> => {
  const result = await Product.find({});
  return result;
};

// Update a product
const updateProduct = async (
  id: string,
  payload: Partial<IProduct>,
): Promise<IProduct | null> => {
  const result = await Product.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  return result;
};

// Delete a product
const deleteProduct = async (id: string): Promise<IProduct | null> => {
  const isExistProduct = await Product.findById(id);
  if (!isExistProduct) {
    throw new ApiError(httpStatus.NOT_FOUND, 'product not found');
  }

  // delete image in cloudinary
  const allurl = [
    isExistProduct?.photos.mainPhoto,
    ...isExistProduct.photos.others,
  ];

  await FileUploadHelper.deleteMultipleImagesByUrl(allurl);
][po]  const result = await Product.findByIdAndDelete(id);
  return result;
};

export const productService = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
