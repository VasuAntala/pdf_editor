import express, { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';
import { Share } from '../models/Share';
import { PDF } from '../models/PDF';
import { Analytics } from '../models/Analytics';

const router = express.Router();

// Create share link
router.post('/:pdfId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { pdfId } = req.params;
    const { expiresAt, password, allowDownload } = req.body;
    const userId = req.user?.id;

    // Verify PDF ownership
    const pdf = await PDF.findOne({ _id: pdfId, userId });
    if (!pdf) {
      throw new AppError('PDF not found', 404);
    }

    // Create share record
    const shareId = uuidv4();
    const share = new Share({
      _id: shareId,
      pdfId,
      userId,
      expiresAt,
      allowDownload,
      isActive: true
    });
    await share.save();

    // Log analytics
    await Analytics.create({
      userId,
      pdfId,
      eventType: 'PDF_SHARE',
      eventData: { shareId, allowDownload }
    });

    res.status(201).json({
      success: true,
      share: {
        ...share.toObject(),
        shareUrl: `${process.env.FRONTEND_URL}/share/${shareId}`
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get shared PDF
router.get('/:shareId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shareId } = req.params;
    const { password } = req.query;

    // Get share details
    const share = await Share.findById(shareId);
    if (!share || !share.isActive) {
      throw new AppError('Share link not found or expired', 404);
    }

    // Check if expired
    if (share.expiresAt && new Date() > new Date(share.expiresAt)) {
      throw new AppError('Share link has expired', 410);
    }

    // Check password if required (not implemented in model, but placeholder)
    // if (share.password && share.password !== password) {
    //   throw new AppError('Invalid password', 401);
    // }

    // Get PDF details
    const pdf = await PDF.findById(share.pdfId);
    if (!pdf) {
      throw new AppError('PDF not found', 404);
    }

    // Log view analytics
    await Analytics.create({
      pdfId: pdf.id,
      eventType: 'PDF_SHARED_VIEW',
      eventData: { shareId }
    });

    res.json({
      success: true,
      pdf: {
        id: pdf.id,
        originalName: pdf.originalName,
        pageCount: pdf.pageCount,
        allowDownload: share.allowDownload
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router; 