import express from 'express';
import { prisma } from '../index';
import { AppError } from '../utils/AppError';
import { requireRole } from '../middleware/auth';

const router = express.Router();

// Get analytics dashboard data
router.get('/dashboard', requireRole(['ADMIN', 'PREMIUM']), async (req, res, next) => {
  try {
    const { period = '7d' } = req.query;
    const userId = (req.user as any)?.id;

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const [totalPdfs, totalShares, totalDownloads, recentActivity] = await Promise.all([
      // Total PDFs
      prisma.pdf.count({
        where: {
          userId,
          isDeleted: false,
          createdAt: { gte: startDate }
        }
      }),
      // Total shares
      prisma.share.count({
        where: {
          userId,
          isActive: true,
          createdAt: { gte: startDate }
        }
      }),
      // Total downloads
      prisma.analytics.count({
        where: {
          userId,
          eventType: 'PDF_DOWNLOAD',
          createdAt: { gte: startDate }
        }
      }),
      // Recent activity
      prisma.analytics.findMany({
        where: {
          userId,
          createdAt: { gte: startDate }
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          pdf: {
            select: {
              id: true,
              originalName: true
            }
          }
        }
      })
    ]);

    res.json({
      success: true,
      analytics: {
        period,
        totalPdfs,
        totalShares,
        totalDownloads,
        recentActivity
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get PDF-specific analytics
router.get('/pdf/:pdfId', async (req, res, next) => {
  try {
    const { pdfId } = req.params;
    const userId = (req.user as any)?.id;

    // Verify PDF ownership
    const pdf = await prisma.pdf.findFirst({
      where: {
        id: pdfId,
        userId,
        isDeleted: false
      }
    });

    if (!pdf) {
      throw new AppError('PDF not found', 404);
    }

    const [views, downloads, shares, editHistory] = await Promise.all([
      // Views
      prisma.analytics.count({
        where: {
          pdfId,
          eventType: 'PDF_VIEW'
        }
      }),
      // Downloads
      prisma.analytics.count({
        where: {
          pdfId,
          eventType: 'PDF_DOWNLOAD'
        }
      }),
      // Shares
      prisma.share.count({
        where: {
          pdfId,
          isActive: true
        }
      }),
      // Edit history
      prisma.pDFEdit.findMany({
        where: { pdfId },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    res.json({
      success: true,
      analytics: {
        views,
        downloads,
        shares,
        editHistory
      }
    });
  } catch (error) {
    next(error);
  }
});

// Track custom event
router.post('/track', async (req, res, next) => {
  try {
    const { eventType, eventData, pdfId, shareId } = req.body;
    const userId = (req.user as any)?.id;

    await prisma.analytics.create({
      data: {
        userId,
        pdfId,
        shareId,
        eventType,
        eventData,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        referrer: req.get('Referrer')
      }
    });

    res.json({
      success: true,
      message: 'Event tracked successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router; 