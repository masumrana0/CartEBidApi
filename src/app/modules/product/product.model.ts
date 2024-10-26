import { Schema, model } from 'mongoose';
import { IProduct } from './product.interface';

// Create Product Schema based on IProduct interface
const ProductSchema = new Schema<IProduct>({
  photos: {
    mainPhoto: { type: String, required: true },
    others: { type: [String], required: true },
  },
  make: { type: String, required: true },
  model: { type: String, required: true },
  mileage: { type: String, required: true },
  vin: { type: String, required: true },
  titleStatus: { type: String, required: true },
  location: { type: String, required: true },
  seller: {
    type: String,
    required: true,
  },
  engine: { type: String, required: true },
  drivetrain: { type: String, required: true },
  transmission: { type: String, enum: ['automatic', 'manual'], required: true },
  bodyStyle: {
    type: String,
    enum: [
      'coupe',
      'convertible',
      'sedan',
      'suv/crossover',
      'truck',
      'van/minivan',
    ],
    required: true,
  },
  exteriorColor: { type: String, required: true },
  interiorColor: { type: String, required: true },
  sellerType: { type: String, required: true },
  highlights: { type: [String], required: true },
  equipment: { type: [String], required: true },
  modification: { type: [String], required: false }, // Optional field
  recentServiceHistory: { type: [String], required: false }, // Optional field
  otherItemsIncludedInSale: { type: [String], required: false }, // Optional field
  ownershipHistory: { type: String, required: false }, // Optional field
  sellerNotes: { type: [String], required: false }, // Optional field
  videos: { type: [String], required: false }, // Optional field
  views: { type: Number, default: 0, required: true },
  bids: {
    bidsHistory: { type: [Schema.Types.Mixed], required: true },
    minBid: { type: Number, required: true },
    maxBid: { type: Number, required: true },
  },
});

// Create and export the Product model
export const Product = model<IProduct>('Product', ProductSchema);
