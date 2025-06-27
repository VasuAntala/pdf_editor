import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: 'USER' | 'ADMIN' | 'PREMIUM';
  isVerified: boolean;
  isActive: boolean;
  avatar?: string;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['USER', 'ADMIN', 'PREMIUM'],
    default: 'USER'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  avatar: {
    type: String
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

export const User = mongoose.model<IUser>('User', userSchema); 