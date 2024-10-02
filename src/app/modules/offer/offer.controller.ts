import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { IOffer } from './offer.interface';
import { offerService } from './offer.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { IUploadFile } from '../../../inerfaces/file';

// Create Offer
const createOffer = catchAsync(async (req: Request, res: Response) => {
  const data = JSON.parse(req.body.data);
  const file = req.file;
  const user = req.user;

  const offer = {
    user: user?.userId,
    ...data,
  };

  const result = await offerService.createOffer(offer, file as IUploadFile);
  sendResponse<IOffer>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Offer created successfully!',
    data: result,
  });
});

// Get all offers
const getAllOffers = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;

  const result = await offerService.getAllOffers(query?.category as string);
  sendResponse<IOffer[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Offers fetched successfully!',
    data: result,
  });
});

// Get all offers
const getSpecificUserOffer = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const query = req.query;

  // Allow if the user role is 'admin' or the user type is 'business'

  const result = await offerService.getSpecificUserOffer(
    user?.userId as string,
    query?.category as string,
  );

  sendResponse<IOffer[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Offers fetched successfully!',
    data: result,
  });
});

// Get offer by ID
const getOfferById = catchAsync(async (req: Request, res: Response) => {
  const offerId = req.params.id;

  const result = await offerService.getOfferById(offerId);
  if (!result) {
    return sendResponse<null>(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Offer not found',
      data: null,
    });
  }

  sendResponse<IOffer>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Offer fetched successfully!',
    data: result,
  });
});

// Update offer
const updateOffer = catchAsync(async (req: Request, res: Response) => {
  const offerId = req.params.id;
  const { ...offerData } = req.body;

  const result = await offerService.updateOffer(offerId, offerData);
  if (!result) {
    return sendResponse<null>(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Offer not found',
      data: null,
    });
  }

  sendResponse<IOffer>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Offer updated successfully!',
    data: result,
  });
});

// Delete offer
const deleteOffer = catchAsync(async (req: Request, res: Response) => {
  const offerId = req.params.id;

  const result = await offerService.deleteOffer(offerId);
  if (!result) {
    return sendResponse<null>(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Offer not found',
      data: null,
    });
  }

  sendResponse<IOffer>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Offer deleted successfully!',
    data: result,
  });
});

export const offerController = {
  createOffer,
  getAllOffers,
  getOfferById,
  updateOffer,
  deleteOffer,
  getSpecificUserOffer,
};
