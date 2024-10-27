import { Schema, model, Types } from 'mongoose';
import { IProductComment } from './comment.interface';

const productCommentSchema = new Schema<IProductComment>(
  {
    user: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Create the ProductComment model
export const ProductComment = model<IProductComment>(
  'ProductComment',
  productCommentSchema,
);
