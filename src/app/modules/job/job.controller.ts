import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
// import { paginationFields } from '../../../constant/pagination';
import { IUploadFile } from '../../../inerfaces/file';
import catchAsync from '../../../shared/catchAsync';
// import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
// import { jobFilterableFields } from './job.constant';
import { IJob } from './job.interface';
import { JobService } from './job.service';

const createJob = catchAsync(async (req: Request, res: Response) => {
  const tokenInfo = req.user as JwtPayload;

  const data = JSON.parse(req.body?.data);
  const file = req.file as IUploadFile;
  const result = await JobService.createJob(data, file, tokenInfo);

  sendResponse<IJob>(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'job created successfully !',
    data: result,
  });
});

export const JobController = {
  createJob,
};
