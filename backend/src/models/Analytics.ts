import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalytics extends Document {
  userId?: mongoose.Types.ObjectId;
  pdfId?: mongoose.Types.ObjectId;
  eventType: 'PAGE_VIEW' | 'PDF_UPLOAD' | 'PDF_DOWNLOAD' | 'PDF_EDIT' | 'PDF_SHARE' | 'PDF_CONVERT' | 'USER_LOGIN' | 'USER_REGISTER' | 'AD_IMPRESSION' | 'AD_CLICK';
  eventData?: any;
  userAgent?: string;
  ipAddress?: string;
  timestamp: Date;
}

const analyticsSchema = new Schema<IAnalytics>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  pdfId: {
    type: Schema.Types.ObjectId,
    ref: 'PDF'
  },
  eventType: {
    type: String,
    enum: ['PAGE_VIEW', 'PDF_UPLOAD', 'PDF_DOWNLOAD', 'PDF_EDIT', 'PDF_SHARE', 'PDF_CONVERT', 'USER_LOGIN', 'USER_REGISTER', 'AD_IMPRESSION', 'AD_CLICK'],
    required: true
  },
  eventData: {
    type: Schema.Types.Mixed
  },
  userAgent: {
    type: String
  },
  ipAddress: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export const Analytics = mongoose.model<IAnalytics>('Analytics', analyticsSchema); 