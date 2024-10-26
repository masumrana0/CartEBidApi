import { Schema, model } from 'mongoose';
import { IProduct } from './product.interface';
import {
  bodyStyleEnum,
  titleStatusEnum,
  transmissionEnum,
} from './product.constant';

//  Product Schema based on IProduct interface
const ProductSchema = new Schema<IProduct>(
  {
    photos: {
      mainPhoto: {
        type: String,
        required: true,
      },
      others: {
        type: [String],
        required: true,
      },
      docs: {
        type: [String],
        required: true,
      },
    },
    title: {
      type: String,
      required: true,
    },
    make: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    mileage: {
      type: String,
      required: true,
    },
    vin: {
      type: String,
      required: true,
    },
    titleStatus: {
      type: String,
      enum: titleStatusEnum,
      required: true,
    },
    location: {
      city: {
        type: String,
        required: false,
      },
      zipCode: {
        type: Number,
        required: false,
      },
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    engine: {
      type: String,
      required: true,
    },
    drivetrain: {
      type: String,
      required: true,
    },
    transmission: {
      type: String,
      enum: transmissionEnum,
      required: true,
    },
    bodyStyle: {
      type: String,
      enum: bodyStyleEnum,
      required: true,
    },
    launchingYear: {
      type: Number,
      required: true,
    },
    exteriorColor: {
      type: String,
      required: true,
    },
    interiorColor: {
      type: String,
      required: true,
    },
    sellerType: {
      type: String,
      required: false,
    },
    highlights: {
      type: [String],
      required: true,
    },
    equipment: {
      type: [String],
      required: true,
    },
    modification: {
      type: [String],
      required: false,
    },
    recentServiceHistory: {
      type: [String],
      required: false,
    },
    otherItemsIncludedInSale: {
      type: [String],
      required: false,
    },
    ownershipHistory: {
      type: String,
      required: false,
    },
    sellerNotes: {
      type: [String],
      required: false,
    },
    videos: {
      type: [String],
      required: false,
    },
    views: {
      type: Number,
      default: 0,
      required: false,
    },
    bids: {
      bidsHistory: [
        {
          buyer: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
          },
          amount: {
            type: Number,
            required: true,
          },
          biddingTime: {
            type: Date,
            required: true,
          },
        },
      ],
      biddingDuration: {
        startBid: {
          type: Date,
          required: true,
        },
        endBid: {
          type: Date,
          required: true,
        },
      },
      minBid: {
        type: Number,
        required: true,
      },
      maxBid: {
        type: Number,
        required: true,
      },
    },
  },

  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);

//  Product model
export const Product = model<IProduct>('Product', ProductSchema);
