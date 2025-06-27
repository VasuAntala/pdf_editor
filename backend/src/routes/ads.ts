import express from 'express';
import { prisma } from '../index';
import { AppError } from '../utils/AppError';
import { requireRole } from '../middleware/auth';

const router = express.Router();

// Get ads for a specific page/context
router.get('/serve', async (req, res, next) => {
  try {
    const { type, page } = req.query;

    const ads = await prisma.ad.findMany({
      where: {
        type: type as any,
        isActive: true
      },
      orderBy: { impressions: 'asc' },
      take: 3
    });

    // Increment impressions for served ads
    await Promise.all(
      ads.map(ad =>
        prisma.ad.update({
          where: { id: ad.id },
          data: { impressions: { increment: 1 } }
        })
      )
    );

    res.json({
      success: true,
      ads
    });
  } catch (error) {
    next(error);
  }
});

// Track ad click
router.post('/click/:adId', async (req, res, next) => {
  try {
    const { adId } = req.params;

    await prisma.ad.update({
      where: { id: adId },
      data: { clicks: { increment: 1 } }
    });

    await prisma.analytics.create({
      data: {
        eventType: 'AD_CLICK',
        eventData: { adId },
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        referrer: req.get('Referrer')
      }
    });

    res.json({
      success: true,
      message: 'Click tracked successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router; 