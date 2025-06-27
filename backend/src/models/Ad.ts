import mongoose, { Document, Schema } from 'mongoose';

export interface IAd extends Document {
  adType: 'BANNER' | 'SIDEBAR' | 'POPUP' | 'INLINE';
  title: string;
  description?: string;
  imageUrl?: string;
  linkUrl: string;
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
  impressions: number;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
}

const adSchema = new Schema<IAd>({
  adType: {
    type: String,
    enum: ['BANNER', 'SIDEBAR', 'POPUP', 'INLINE'],
    required: true
  },
  title: { type: String, required: true },
  description: { type: String },
  imageUrl: { type: String },
  linkUrl: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 }
}, {
  timestamps: true
});

export const Ad = mongoose.model<IAd>('Ad', adSchema); 