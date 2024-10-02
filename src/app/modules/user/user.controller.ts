import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import { IUser } from '../user/user.interface';
import sendResponse from '../../../shared/sendResponse';
import httpStatus from 'http-status';
import { UserService } from './user.service';
import pick from '../../../shared/pick';
import { paginationFields } from '../../../constant/pagination';
import { userFilterableFields } from './user.constant';
import { IUploadFile } from '../../../inerfaces/file';

const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.createUser(req.body);

  sendResponse<IUser>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'user created successfully !',
    data: result,
  });
});

const getAllUser = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, userFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);

  const result = await UserService.getAllUser(filters, paginationOptions);

  sendResponse<IUser[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'user fetched successfully !',
    meta: result.meta,
    data: result.data,
  });
});

const getOneUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await UserService.getOneUser(id);

  sendResponse<IUser>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'user fatched successfully !',
    data: result,
  });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const data = JSON.parse(req.body?.data);
  const file = req.file;

  const result = await UserService.updateUser(id, data, file as IUploadFile);

  sendResponse<IUser>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'user updated successfully !',
    data: result,
  });
});

const deleteUserByadmin = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  await UserService.deleteUser(id);

  sendResponse<void>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'user deleted successfully !',
    data: null,
  });
});

export const UserController = {
  getAllUser,
  getOneUser,
  updateUser,
  createUser,
  deleteUserByadmin,
};
