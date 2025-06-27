import express, { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';
import { Analytics } from '../models/Analytics';
import { PDF } from '../models/PDF';
import { Share } from '../models/Share';

const router = express.Router();

// Get analytics dashboard data
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    // Get counts
    const [pdfCount, shareCount, analyticsCount] = await Promise.all([
      PDF.countDocuments({ userId }),
      Share.countDocuments({ userId, isActive: true }),
      Analytics.countDocuments({ userId })
    ]);
    // Get recent analytics
    const recentAnalytics = await Analytics.find({ userId }).sort({ timestamp: -1 }).limit(10);
    // Get analytics by event type
    const eventTypeStats = await Analytics.aggregate([
      { $match: { userId } },
      { $group: { _id: '$eventType', count: { $sum: 1 } } }
    ]);
    res.json({
      success: true,
      stats: {
        totalPdfs: pdfCount,
        totalShares: shareCount,
        totalAnalytics: analyticsCount
      },
      recentAnalytics,
      eventTypeStats
    });
  } catch (error) {
    next(error);
  }
});

// Get PDF analytics
router.get('/pdf/:pdfId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { pdfId } = req.params;
    const userId = req.user?.id;
    // Verify PDF ownership
    const pdf = await PDF.findOne({ _id: pdfId, userId });
    if (!pdf) {
      throw new AppError('PDF not found', 404);
    }
    // Get analytics for this PDF
    const analytics = await Analytics.find({ pdfId }).sort({ timestamp: -1 });
    // Get analytics counts
    const [viewCount, downloadCount, editCount] = await Promise.all([
      Analytics.countDocuments({ pdfId, eventType: 'PDF_VIEW' }),
      Analytics.countDocuments({ pdfId, eventType: 'PDF_DOWNLOAD' }),
      Analytics.countDocuments({ pdfId, eventType: 'PDF_EDIT' })
    ]);
    // Get edit history (not implemented, placeholder)
    const edits = [];
    res.json({
      success: true,
      pdf,
      analytics,
      stats: {
        views: viewCount,
        downloads: downloadCount,
        edits: editCount
      },
      edits
    });
  } catch (error) {
    next(error);
  }
});

// Track custom event
router.post('/track', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { eventType, eventData, pdfId } = req.body;
    const userId = req.user?.id;
    await Analytics.create({
      userId,
      pdfId,
      eventType,
      eventData
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router; 