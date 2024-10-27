import { Types } from 'mongoose';
import { ICommonProfile } from '../../user/user.interface';
import { IProduct } from '../product.interface';

export type IProductComment = {
  user: Types.ObjectId | ICommonProfile | string;
  product: Types.ObjectId | IProduct | string;
  comment: string;
};
