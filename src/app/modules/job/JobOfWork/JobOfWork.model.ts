import { model, Schema, Types } from 'mongoose';
import { IJobOfWork } from './JobOfWork.interface';
import { userRole } from '../../user/user.constant';

const JobOfWorkSchema = new Schema<IJobOfWork>(
  {
    job: {
      type: Types.ObjectId,
      ref: 'RunningJob',
      required: true,
    },
    OwnerRole: userRole,

    works: [
      {
        jobOwner: Types.ObjectId,
        worker: Types.ObjectId,
        note: {
          type: String,
          required: false,
          default: null,
        },
        proofs: [
          {
            title: {
              type: String,
              required: true,
            },
            type: {
              type: String,
              enum: ['screenshot proof', 'text proof'],
              required: true,
            },
            value: {
              type: String,
              required: true,
            },
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);

export const PendingWork = model<IJobOfWork>('PendingWork', JobOfWorkSchema);
export const DoneWOrk = model<IJobOfWork>('DoneWork', JobOfWorkSchema);
export const RejectWork = model<IJobOfWork>('RejectWork', JobOfWorkSchema);
