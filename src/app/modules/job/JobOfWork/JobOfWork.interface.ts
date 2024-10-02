import { Types } from 'mongoose';
import { IJob } from '../job.interface';
import { IUser } from '../../user/user.interface';


export type IWork = {
  _id?: Types.ObjectId | string
  jobOwner: Types.ObjectId | IUser | string;
  worker: Types.ObjectId | IUser | string;
  note?: string;
  proofs: {
    title: string;
    type: 'screenshot proof' | 'text proof';
    value: string | string[] | null;
  }[];
};

export type IJobOfWork = {
  job: string | Types.ObjectId | IJob;
  OwnerRole: 'admin' | 'customer' | 'super_admin';
  works: IWork[]
};
