import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import { IUploadFile } from '../../../../inerfaces/file';
import catchAsync from '../../../../shared/catchAsync';
import sendResponse from '../../../../shared/sendResponse';
import { IJobOfWork } from './JobOfWork.interface';
import { jobOfWorkService } from './JobOfWork.service';

const submitJobOfWork = catchAsync(async (req: Request, res: Response) => {
  const data = JSON.parse(req.body?.data);
  const tokenInfo = req.user as JwtPayload;

  const workData: IJobOfWork = { ...data };
  const files = req.files as IUploadFile[];

  const result = await jobOfWorkService.submitJobOfWork(
    files,
    workData,
    tokenInfo,
  );

  sendResponse<IJobOfWork | []>(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'your work submited successful.',
    data: result,
  });
});

const isSubmitedWork = catchAsync(async (req: Request, res: Response) => {
  const jobId = req.params.id;
  const tokenInfo = req.user as JwtPayload;

  const result = await jobOfWorkService.isSubmitedWork(tokenInfo, jobId);

  // console.log(result)
  sendResponse<{ isSubmited: boolean }>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'is job submited result',
    data: result,
  });
});

const getSpecificClientJobWork = catchAsync(
  async (req: Request, res: Response) => {
    const tokenInfo = req.user as JwtPayload;

    const result = await jobOfWorkService.getSpecificJobOwnerWork(
      tokenInfo as JwtPayload,
    );

    sendResponse<IJobOfWork[]>(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'works fatched successful.',
      data: result,
    });
  },
);

const submitWorkSatisfy = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;
  const tokenInfo = req.user as JwtPayload;



  const result = await jobOfWorkService.submitWorkSatisfy(tokenInfo, data)


  sendResponse<IJobOfWork | []>(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'your work submited successful.',
    data: result,
  });
});

export const jobOfWorkController = {
  submitJobOfWork,
  getSpecificClientJobWork,
  isSubmitedWork,
};
