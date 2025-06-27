import mongoose, { Document, Schema } from 'mongoose';

export interface IShare extends Document {
  pdfId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  shareToken: string;
  isActive: boolean;
  expiresAt?: Date;
  allowDownload?: boolean;
  createdAt: Date;
}

const shareSchema = new Schema<IShare>({
  pdfId: {
    type: Schema.Types.ObjectId,
    ref: 'PDF',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shareToken: {
    type: String,
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date
  },
  allowDownload: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export const Share = mongoose.model<IShare>('Share', shareSchema); 