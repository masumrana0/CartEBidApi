/* eslint-disable no-unused-vars */
import { Model } from 'mongoose';

export type ICommonProfile = {
  userId: string;
  name: string;
  profilePhoto?: string;
};

export type IUser = {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role?: 'customer' | 'admin' | 'super_admin';
  accountType?: 'personal' | 'business';
  sellerType?: 'private' | 'dealer';
  documents?: string[];
  membership?: 'free' | 'faid';
  contactNo?: string;
  profilePhoto?: string;
  passwordChangedAt?: Date;
  isEmailVerified?: boolean;
  isVerified?: boolean;
};

export type IUserFilters = {
  searchTerm?: string;
  role?: string;
  email?: string;
  accountType?: string;
  contactNo?: string;
  membership?: string;
};

export type UserModel = {
  isUserExist(email: string): Promise<IUser>;
  isPasswordMatched(
    givenPassword: string,
    savedPassword: string,
  ): Promise<boolean>;
} & Model<IUser>;
