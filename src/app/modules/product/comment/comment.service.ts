import httpStatus from 'http-status';
import ApiError from '../../../../errors/ApiError';
import { ProductComment } from './comment.model';
import { IProductComment } from './comment.interface';

// Create a new product comment
const createComment = async (
  payload: IProductComment,
): Promise<IProductComment> => {
  return await ProductComment.create(payload);
};

// Get comments for a specific product
const getProductComments = async (
  productId: string,
): Promise<IProductComment[]> => {
  return await ProductComment.find({ product: productId }).populate({
    path: 'user',
    select: '_id profilePhoto name',
  });
};

// Delete a product comment with authorization check
const deleteComment = async (
  commentId: string,
  userId: string,
): Promise<IProductComment | null> => {
  const comment = (await ProductComment.findById(commentId)) as IProductComment;

  if (!comment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Comment not found');
  }

  if (String(comment.user) !== userId) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'You are not authorized to delete this comment',
    );
  }

  return await ProductComment.findByIdAndDelete(commentId);
};

export const ProductCommentService = {
  createComment,
  getProductComments,
  deleteComment,
};
