import { SortOrder, startSession } from 'mongoose';
import { paginationHelpers } from '../../../helper/paginationHelper';
import { IPaginationOptions } from '../../../inerfaces/pagination';
import { IGenericResponse } from '../../../shared/sendResponse';
import { IUser, IUserFilters } from '../user/user.interface';
import { User } from '../user/user.model';
import { userSearchableFields } from './user.constant';
import ApiError from '../../../errors/ApiError';
import httpStatus from 'http-status';
import { AuthService } from '../auth/auth.service';
import { IUploadFile } from '../../../inerfaces/file';
import { FileUploadHelper } from '../../../helper/FileUploadHelper';

const createUser = async (payload: IUser): Promise<IUser> => {
  const isNotUniqueEmail = await User.isUserExist(payload.email);
  if (isNotUniqueEmail) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'Sorry, this email address is already in use.',
    );
  }

  const session = await startSession();
  session.startTransaction();

  try {
    // Create User
    const user = await User.create(payload);

    await AuthService.sendVerificationEmail({ email: user?.email });

    // Login User
    return user;
    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    // Rollback the transaction
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getAllUser = async (
  filters: IUserFilters,
  paginationOptions: IPaginationOptions,
): Promise<IGenericResponse<IUser[]>> => {
  // Extract searchTerm to implement search query
  const { searchTerm, ...filtersData } = filters;
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const andConditions = [];
  // Search needs $or for searching in specified fields
  if (searchTerm) {
    andConditions.push({
      $or: userSearchableFields.map(field => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    });
  }
  // Filters needs $and to fullfill all the conditions
  if (Object.keys(filtersData).length) {
    andConditions.push({
      $and: Object.entries(filtersData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  // Dynamic  Sort needs  field to  do sorting
  const sortConditions: { [key: string]: SortOrder } = {};
  if (sortBy && sortOrder) {
    sortConditions[sortBy] = sortOrder;
  }
  const whereConditions =
    andConditions.length > 0 ? { $and: andConditions } : {};

  const result = await User.find(whereConditions)
    .sort(sortConditions)
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments(whereConditions);

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};
const getOneUser = async (id: string): Promise<IUser | null> => {
  const result = await User.findById(id);
  return result;
};

const updateUser = async (
  id: string,
  payload?: Partial<IUser>,
  file?: IUploadFile,
): Promise<IUser | null> => {
  const isUserExist = await User.findById(id);
  if (!isUserExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'user not found');
  }
  let url;
  if (file) {
    url = await FileUploadHelper.uploadSinleToCloudinary(file);
  }

  if (payload?.email || payload?.password) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Bad Request');
  }
  const userData = {
    ...payload,
    profilePhoto: url,
  };
  const result = await User.findByIdAndUpdate(id, userData, {
    new: true,
  });
  return result;
};

const deleteUser = async (id: string): Promise<void> => {
  // Check if the user exists
  const isExist = await User.findById(id);

  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found!');
  }

  // Delete the user
  await User.findByIdAndDelete(id);
};

// Gernerate common User data

// const gennerateCommonProfile = async (userId: string) => {
//   const result = await User.findById(userId).selected({
//     profilePhoto: 1,
//     name: 1,
//     _id: 1,
//   });
// };

export const UserService = {
  getAllUser,
  getOneUser,
  updateUser,
  createUser,
  deleteUser,
};
