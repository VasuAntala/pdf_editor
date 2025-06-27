import mongoose, { Document, Schema } from 'mongoose';

export interface IPDF extends Document {
  filename: string;
  originalName: string;
  fileSize: number;
  pageCount: number;
  filePath: string;
  userId?: mongoose.Types.ObjectId;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  isEncrypted: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const pdfSchema = new Schema<IPDF>({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  pageCount: {
    type: Number,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  title: {
    type: String
  },
  author: {
    type: String
  },
  subject: {
    type: String
  },
  creator: {
    type: String
  },
  producer: {
    type: String
  },
  creationDate: {
    type: Date
  },
  modificationDate: {
    type: Date
  },
  isEncrypted: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export const PDF = mongoose.model<IPDF>('PDF', pdfSchema); 