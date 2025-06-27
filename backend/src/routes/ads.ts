import express, { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { Ad } from '../models/Ad';
import { Analytics } from '../models/Analytics';

const router = express.Router();

// Get all ads
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ads = await Ad.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({
      success: true,
      ads
    });
  } catch (error) {
    next(error);
  }
});

// Update ad impression
router.post('/:id/impression', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await Ad.findByIdAndUpdate(id, { $inc: { impressions: 1 } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Update ad click
router.post('/:id/click', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await Ad.findByIdAndUpdate(id, { $inc: { clicks: 1 } });
    // Log analytics
    await Analytics.create({
      eventType: 'AD_CLICK',
      eventData: { adId: id }
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router; 