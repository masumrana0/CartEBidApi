import { Types } from 'mongoose';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type IProduct = {
  _id: string;
  photos: {
    mainPhoto: string;
    others: string[];
  };
  make: string;
  model: string;
  mileage: string;
  vin: string;
  titleStatus: string;
  location: string;
  seller: Types.ObjectId | string;
  engine: string;
  drivetrain: string;
  transmission: 'automatic' | 'manual';
  bodyStyle:
    | 'coupe'
    | 'convertible'
    | 'hatchback'
    | 'sedan'
    | 'suv/crossover'
    | 'truck'
    | 'van/minivam'
    | 'wagon';
  exteriorColor: string;
  interiorColor: string;
  sellerType: string;
  highlights: string[];
  equipment: string[];
  modification: string[];
  recentServiceHistory: string[];
  otherItemsIncludedInSale: string[];
  ownershipHistory: string;
  sellerNotes: string[];
  videos: string[];
  views: number;
  bids: {
    bidsHistory: any[];
    minBid: number;
    maxBid: number;
  };
  comments: any[];
};
