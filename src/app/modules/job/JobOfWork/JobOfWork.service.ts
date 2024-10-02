import httpStatus from 'http-status';
import ApiError from '../../../../errors/ApiError';
import { FileUploadHelper } from '../../../../helper/FileUploadHelper';
import { IUploadFile } from '../../../../inerfaces/file';
import { IJobOfWork, IWork } from './JobOfWork.interface';
import { PendingWork } from './JobOfWork.model';
import mongoose from 'mongoose';
import { JwtPayload } from 'jsonwebtoken';
import { PendingJob, RunningJob } from '../job.model';

const submitJobOfWork = async (
  files: IUploadFile[],
  payload: IJobOfWork,
  tokenInfo: JwtPayload,
): Promise<IJobOfWork | [] | null> => {
  const { works, ...otherData } = payload;
  const { job } = otherData;
  const isExistJob = await RunningJob.findById(job);
  if (!isExistJob) {
    throw new ApiError(httpStatus.NOT_FOUND, 'job not found');
  }

  const role = tokenInfo?.role;
  const isAdmin = role == 'admin' || role == 'super_admin';
  if (isAdmin) {
    otherData.OwnerRole = 'admin';
  } else {
    otherData.OwnerRole = role;
  }

  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Upload files to Cloudinary and get the URLs
    const urls = (await FileUploadHelper.uploadMultipleToCloudinary(
      files,
    )) as string[];

    // Attach image URLs to the corresponding proofs
    const worksWithUrls = works.map(work => ({
      ...work,
      proofs: work.proofs.map((proof, proofIndex) => ({
        type: proof.type,
        value:
          proof.type === 'screenshot proof'
            ? urls[proofIndex] || '' // Map URLs to proofs based on index
            : proof.value || '',
        title: proof.title,
      })),
    }));

    // Check if the job already exists
    const existingJob = await PendingWork
      .findOne({ job: job })
      .populate('job')
      .session(session)
      .exec();

    // Guard: Ensure that the worker hasn't already submitted a job for this work
    const isDuplicateSubmission = existingJob
      ? existingJob.works.some(existingWork =>
        worksWithUrls.some(
          newWork =>
            newWork.worker.toString() === existingWork.worker.toString(), // Convert ObjectIDs to strings for comparison
        ),
      )
      : false;

    // console.log('isDulicateSubmission', isDuplicateSubmission)

    if (isDuplicateSubmission) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Worker has already submitted work for this job.',
      );
    }

    if (existingJob) {
      // If the job exists, update it with new work
      existingJob.works.push(...worksWithUrls);
      await existingJob.save({ session });
      await session.commitTransaction();
      return existingJob;
    } else {
      const allData = { ...otherData, work: worksWithUrls };

      // If the job does not exist, create a new one
      const newJob = await PendingWork.create([allData], {
        session,
      });
      await session.commitTransaction();
      return newJob[0]; // Since create returns an array
    }
  } catch (error) {
    // Roll back the transaction in case of any error
    await session.abortTransaction();
    // console.error('Error submitting job of work:', error);
    throw error; // Re-throw the error to handle it appropriately
  } finally {
    // End the session
    session.endSession();
  }
};

const isSubmitedWork = async (
  user: JwtPayload,
  jobId: string,
): Promise<{ isSubmited: boolean }> => {
  const userId = user?.userId;

  // Check if the job already exists
  const existingJob = await PendingWork
    .findOne({ job: jobId })
    .populate('job')
    .exec();

  // Guard: Ensure that the worker (userId) hasn't already submitted a job for this work
  const isDuplicateSubmission = existingJob
    ? existingJob.works.some(
      existingWork => existingWork.worker.toString() === userId.toString(),
    )
    : false;

  const result = {
    isSubmited: isDuplicateSubmission,
  };

  return result;
};

const getSpecificJobOwnerWork = async (tokenInfo: JwtPayload) => {
  const jobOwnerId = tokenInfo?.userId as string;
  const role = tokenInfo?.role;
  const isAdmin = role == 'admin' || role == 'super_admin';
  if (isAdmin) {
    const result = await PendingWork
      .find({ OwnerRole: 'admin' })
      .populate('job')
      .exec();
    return result;
  } else {
    const result = await PendingWork
      .find({
        works: { $elemMatch: { jobOwner: jobOwnerId } },
      })
      .populate('job')
      .exec();

    return result;
  }
};



const submitWorkSatisfy = async (tokenInfo: JwtPayload, payload: { workCollectionId: string, workId: string }) => {
  // Type the result of findById to your interface type (e.g., IPendingJob)
  const existingWorkCollection = await PendingJob.findById(payload.workCollectionId) as IJobOfWork

  // Check if the work collection exists
  if (!existingWorkCollection) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Work collection does not exist');
  }

  // Ensure that `works` is defined and not undefined
  const specificWork = existingWorkCollection.works?.find(
    (work) => work._id?.toString() === payload.workId
  );


  // Check if the specific work exists
  if (!specificWork) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Work not found in this collection');
  }

  // Continue your logic here, e.g., update work status, etc.
  return specificWork; // Or whatever action you want to take with this work
};

export const jobOfWorkService = {
  submitJobOfWork,
  getSpecificJobOwnerWork,
  submitWorkSatisfy,
  isSubmitedWork,
};
