import ApiError from '../../../errors/ApiError';
import { FileUploadHelper } from '../../../helper/FileUploadHelper';
import { IUploadFile } from '../../../inerfaces/file';
import { IProduct } from './product.interface';
import { Product } from './product.model';
import httpStatus from 'http-status';

const createProduct = async (
  productData: IProduct,
  files: IUploadFile[],
): Promise<IProduct | null> => {
  // Track uploaded URLs for cleanup in case of failure
  let uploadedUrls: string[] = [];

  try {
    // 1. Validate input files
    const mainPhotoFile = files.find(file => file.fieldname === 'mainPhoto');
    const otherPhotos = files.filter(file => file.fieldname === 'others');
    const docPhotos = files.filter(file => file.fieldname === 'docs');

    if (!mainPhotoFile) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Main photo is required');
    }
    if (otherPhotos.length === 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'At least one other photo is required',
      );
    }
    if (docPhotos.length === 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'At least one document photo is required',
      );
    }

    // uploading all file
    const mainPhotoUrl = (await FileUploadHelper.uploadSinleToCloudinary(
      mainPhotoFile,
    )) as string;

    const otherPhotoUrls =
      await FileUploadHelper.uploadMultipleToCloudinary(otherPhotos);

    const docsPhotoUrls =
      await FileUploadHelper.uploadMultipleToCloudinary(docPhotos);

    uploadedUrls = [mainPhotoUrl, ...otherPhotoUrls, ...docsPhotoUrls];

    // 3. Create product with uploaded URLs
    const productWithPhotos: IProduct = {
      ...productData,
      photos: {
        mainPhoto: mainPhotoUrl,
        others: otherPhotoUrls,
        docs: docsPhotoUrls,
      },
    };

    // Save to database
    const result = await Product.create(productWithPhotos);
    return result;
  } catch (error) {
    //  Clean up uploaded files if any step fails
    if (uploadedUrls.length > 0) {
      try {
        await FileUploadHelper.deleteMultipleImagesByUrl(uploadedUrls);
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded files:', cleanupError);
      }
    }
    // Return null if an error occurs
    return null;
  }
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
  const result = await Product.findByIdAndDelete(id);
  return result;
};

export const productService = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
