import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';
import { PDF } from '../models/PDF';
import { Share } from '../models/Share';
import { Analytics } from '../models/Analytics';

const router = express.Router();

// Get user profile
router.get('/profile', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new AppError('User not found', 404);
    }
    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { firstName, lastName, email, currentPassword, newPassword } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (newPassword) {
      if (!currentPassword) {
        throw new AppError('Current password is required to change password', 400);
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        throw new AppError('Current password is incorrect', 400);
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }
    await user.save();
    res.json({
      success: true,
      user: user.toObject()
    });
  } catch (error) {
    next(error);
  }
});

// Get user statistics
router.get('/stats', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    // Get PDF stats
    const pdfs = await PDF.find({ userId });
    const total = pdfs.length;
    const totalSize = pdfs.reduce((sum, pdf) => sum + (pdf.fileSize || 0), 0);
    // Get share stats
    const shares = await Share.find({ userId, isActive: true });
    // Get analytics stats
    const analyticsStats = await Analytics.aggregate([
      { $match: { userId } },
      { $group: { _id: '$eventType', count: { $sum: 1 } } }
    ]);
    res.json({
      success: true,
      stats: {
        pdfs: {
          total,
          totalSize
        },
        shares: {
          total: shares.length
        },
        analytics: analyticsStats
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router; 