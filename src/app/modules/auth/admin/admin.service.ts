/**
 * Title: 'Admin Authentication service'
 * Description: ''
 * Author: 'Masum Rana'
 * Date: 171-07-2024
 *
 */

import { IUser } from '../../user/user.interface';
import { User } from '../../user/user.model';
import { AuthService } from '../auth.service';
import { startSession } from 'mongoose';

import ApiError from '../../../../errors/ApiError';
import httpStatus from 'http-status';

// user registration
const adminRegistration = async (payload: IUser): Promise<IUser> => {
  const {
    isEmailVerified,
    isVerified,
    earningBalance,
    mainBalance,
    rechargeEarningBalance,
    ...userPayload
  } = payload;

  if (
    isEmailVerified ||
    isVerified ||
    earningBalance ||
    mainBalance ||
    rechargeEarningBalance
  ) {
    throw new ApiError(
      httpStatus.EXPECTATION_FAILED,
      'not accept any balance property.',
    );
  }
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
    const user = await User.create(userPayload);

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
export const AdminService = {
  adminRegistration,
};
