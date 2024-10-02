import { addDays, addHours } from 'date-fns';
import { JwtPayload } from 'jsonwebtoken';
import { SortOrder } from 'mongoose';
import { FileUploadHelper } from '../../../helper/FileUploadHelper';
import { paginationHelpers } from '../../../helper/paginationHelper';
import { IUploadFile } from '../../../inerfaces/file';
import { IPaginationOptions } from '../../../inerfaces/pagination';
import { IGenericResponse } from '../../../shared/sendResponse';
import { jobSearchableFields } from './job.constant';
import { IJob, IJobFilters } from './job.interface';
import { PendingJob, RunningJob } from './job.model';
import config from '../../../config';
import { User } from '../user/user.model';
import ApiError from '../../../errors/ApiError';
import httpStatus from 'http-status';
import mongoose, { ClientSession } from 'mongoose';

const createJob = async (
  jobDetails: IJob,
  file: IUploadFile,
  currentUser: JwtPayload,
): Promise<IJob | null> => {
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();

  try {
    const superAdminId = config.super_admin_id;
    const superAdmin = await User.findById(superAdminId).session(session);

    if (!superAdmin) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Super admin not found');
    }

    const superAdminBalance = superAdmin.mainBalance || 0;
    const { role, userId, accountType } = currentUser;
    const totalJobCost = jobDetails.workerEarn * jobDetails.workerNeeded;
    const isUserAdmin = role === 'admin' || role === 'super_admin';

    const isBusinessAccount = role == 'customer' && accountType == 'business';
    // checking user
    if (!isBusinessAccount && !isUserAdmin) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }

    if (isUserAdmin) {
      // Admin or Super Admin handling
      if (superAdminBalance < totalJobCost) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Insufficient balance');
      }

      const thumbnailUrl = await FileUploadHelper.uploadSinleToCloudinary(file);
      const jobData = {
        ...jobDetails,
        thumbnail: thumbnailUrl,
        user: userId,
      };

      const [createdJob] = await RunningJob.create([jobData], { session }); // Extract the first element from the array

      // Commit the transaction
      await session.commitTransaction();
      return createdJob;
    } else {
      // Regular User handling
      const jobOwner = await User.findById(userId).session(session);

      if (!jobOwner) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Job owner not found');
      }

      const jobOwnerBalance = jobOwner.mainBalance || 0;

      if (jobOwnerBalance < totalJobCost) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Insufficient balance');
      }

      const updatedJobOwnerBalance = jobOwnerBalance - totalJobCost;
      jobOwner.mainBalance = updatedJobOwnerBalance;
      await jobOwner.save({ session });

      const updatedSuperAdminBalance = superAdminBalance + totalJobCost;
      superAdmin.mainBalance = updatedSuperAdminBalance;
      await superAdmin.save({ session });

      const thumbnailUrl = await FileUploadHelper.uploadSinleToCloudinary(file);
      const jobData = {
        ...jobDetails,
        thumbnail: thumbnailUrl,
        user: userId,
      };

      const [createdJob] = await PendingJob.create([jobData], { session }); // Extract the first element from the array

      // Commit the transaction
      await session.commitTransaction();
      return createdJob;
    }
  } catch (error) {
    // Rollback the transaction in case of error
    await session.abortTransaction();
    throw error;
  } finally {
    // End the session
    session.endSession();
  }
};

const getOneJob = async (jobId: string): Promise<IJob | null> => {
  const result = await RunningJob.findById({ _id: jobId });
  return result;
};

const getAllJob = async (
  filters: IJobFilters,
  paginationOptions: IPaginationOptions,
): Promise<IGenericResponse<IJob[]> | null> => {
  const { searchTerm, date, ...filtersData } = filters;

  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const andConditions = [];

  // Search functionality using the searchTerm in specified fields
  if (searchTerm) {
    andConditions.push({
      $or: jobSearchableFields.map(field => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    });
  }

  // Time filtering based on the createdAt field
  if (date && date !== 'all') {
    let dateCondition;
    const currentDate = new Date();

    switch (date) {
      case 'last hour':
        dateCondition = { $gte: addHours(currentDate, -1) };
        break;
      case 'last 24 hours':
        dateCondition = { $gte: addHours(currentDate, -24) };
        break;
      case 'last 7 days':
        dateCondition = { $gte: addDays(currentDate, -7) };
        break;
      case 'last 14 days':
        dateCondition = { $gte: addDays(currentDate, -14) };
        break;
      case 'last 30 days':
        dateCondition = { $gte: addDays(currentDate, -30) };
        break;
      case 'all':
        // dateCondition = {};
        break;
      default:
        dateCondition = {};
        break;
    }

    andConditions.push({ createdAt: dateCondition });
  }

  // Filtering based on other fields
  if (Object.keys(filtersData).length) {
    andConditions.push({
      $and: Object.entries(filtersData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  // Dynamic sorting
  const sortConditions: { [key: string]: SortOrder } = {};
  if (sortBy && sortOrder) {
    sortConditions[sortBy] = sortOrder;
  }

  const whereConditions =
    andConditions.length > 0 ? { $and: andConditions } : {};

  const result = await RunningJob.find(whereConditions)
    .sort(sortConditions)
    .skip(skip)
    .limit(limit);

  const total = await RunningJob.countDocuments(whereConditions);

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

export const JobService = {
  createJob,
  getOneJob,
  getAllJob,
};
