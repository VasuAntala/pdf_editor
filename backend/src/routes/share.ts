import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { prisma } from '../index';
import { AppError } from '../utils/AppError';
import { optionalAuthMiddleware } from '../middleware/auth';

const router = express.Router();

// Create share link
router.post('/create', async (req, res, next) => {
  try {
    const { pdfId, expiresAt, downloadLimit } = req.body;
    const userId = (req.user as any)?.id;

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

    const shareToken = uuidv4();

    const share = await prisma.share.create({
      data: {
        pdfId,
        userId,
        shareToken,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        downloadLimit: downloadLimit ? parseInt(downloadLimit) : null
      },
      include: {
        pdf: {
          select: {
            id: true,
            originalName: true,
            fileSize: true,
            pageCount: true
          }
        }
      }
    });

    await prisma.analytics.create({
      data: {
        userId,
        pdfId,
        shareId: share.id,
        eventType: 'PDF_SHARE',
        eventData: {
          shareToken,
          expiresAt,
          downloadLimit
        }
      }
    });

    res.status(201).json({
      success: true,
      share,
      shareUrl: `${process.env.FRONTEND_URL}/share/${shareToken}`
    });
  } catch (error) {
    next(error);
  }
});

// Get shared PDF
router.get('/:token', optionalAuthMiddleware, async (req, res, next) => {
  try {
    const { token } = req.params;

    const share = await prisma.share.findUnique({
      where: { shareToken: token },
      include: {
        pdf: {
          select: {
            id: true,
            originalName: true,
            fileSize: true,
            pageCount: true,
            filePath: true,
            thumbnailPath: true
          }
        },
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!share || !share.isActive) {
      throw new AppError('Share link not found or inactive', 404);
    }

    if (share.expiresAt && new Date() > share.expiresAt) {
      throw new AppError('Share link has expired', 410);
    }

    if (share.downloadLimit && share.downloadCount >= share.downloadLimit) {
      throw new AppError('Download limit reached', 410);
    }

    await prisma.analytics.create({
      data: {
        userId: (req.user as any)?.id,
        pdfId: share.pdfId,
        shareId: share.id,
        eventType: 'PDF_VIEW',
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        referrer: req.get('Referrer')
      }
    });

    res.json({
      success: true,
      share
    });
  } catch (error) {
    next(error);
  }
});

// Download shared PDF
router.get('/:token/download', optionalAuthMiddleware, async (req, res, next) => {
  try {
    const { token } = req.params;
    // Implementation for downloading the PDF
  } catch (error) {
    next(error);
  }
});

// Get user's shares
router.get('/', async (req, res, next) => {
  try {
    const userId = (req.user as any)?.id;
    // Implementation for getting user's shares
  } catch (error) {
    next(error);
  }
});

// Deactivate share
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = (req.user as any)?.id;
    // Implementation for deactivating a share
  } catch (error) {
    next(error);
  }
});

export default router; 