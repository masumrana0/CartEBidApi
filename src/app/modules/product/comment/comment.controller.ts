import { Request, Response } from 'express';
import catchAsync from '../../../../shared/catchAsync';
import { ProductCommentService } from './comment.service';
import { JwtPayload } from 'jsonwebtoken';
import sendResponse from '../../../../shared/sendResponse';
import httpStatus from 'http-status';
import { IProductComment } from './comment.interface';

// Controller to create a new comment on a product
const createComment = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user as JwtPayload;
  const payload = { ...req.body, user: userId };

  const result = await ProductCommentService.createComment(payload);

  sendResponse<IProductComment>(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Comment created successfully!',
    data: result,
  });
});

// Controller to fetch all comments for a specific product
const getComments = catchAsync(async (req: Request, res: Response) => {
  const { id: productId } = req.params;

  const result = await ProductCommentService.getProductComments(productId);

  sendResponse<IProductComment[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Comments fetched successfully!',
    data: result,
  });
});

// Controller to delete a specific comment by ID with authorization check
const deleteComment = catchAsync(async (req: Request, res: Response) => {
  const { id: commentId } = req.params;
  const { userId } = req.user as JwtPayload;

  const result = await ProductCommentService.deleteComment(commentId, userId);

  sendResponse<IProductComment>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Comment deleted successfully!',
    data: result,
  });
});

export const productCommentController = {
  createComment,
  getComments,
  deleteComment,
};
