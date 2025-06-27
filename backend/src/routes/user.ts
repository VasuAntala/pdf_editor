import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index';
import { AppError } from '../utils/AppError';
import { AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Get user profile
router.get('/profile', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            pdfs: {
              where: { isDeleted: false }
            },
            shares: {
              where: { isActive: true }
            }
          }
        }
      }
    });

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
router.put('/profile', [
  body('name').optional().trim().isLength({ min: 2 }),
  body('avatar').optional().isURL()
], async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user!.id;
    const { name, avatar } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(avatar && { avatar })
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isVerified: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
});

// Get user statistics
router.get('/stats', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const [pdfStats, shareStats, recentActivity] = await Promise.all([
      // PDF statistics
      prisma.pdf.groupBy({
        by: ['createdAt'],
        where: {
          userId,
          isDeleted: false
        },
        _count: {
          id: true
        }
      }),
      // Share statistics
      prisma.share.groupBy({
        by: ['createdAt'],
        where: {
          userId,
          isActive: true
        },
        _count: {
          id: true
        }
      }),
      // Recent activity
      prisma.analytics.findMany({
        where: {
          userId,
          eventType: {
            in: ['PDF_UPLOAD', 'PDF_EDIT', 'PDF_DOWNLOAD', 'PDF_SHARE']
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
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
      stats: {
        pdfStats,
        shareStats,
        recentActivity
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router; 