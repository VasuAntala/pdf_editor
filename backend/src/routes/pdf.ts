import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { PDFDocument } from 'pdf-lib';
import { prisma } from '../index';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/pdfs';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new AppError('Only PDF files are allowed', 400));
    }
  }
});

// Upload PDF
router.post('/upload', upload.single('pdf'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const { originalname, filename, size, path: filePath } = req.file;
    const userId = req.user!.id;

    // Get PDF page count
    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();

    // Create PDF record
    const pdf = await prisma.pdf.create({
      data: {
        filename,
        originalName: originalname,
        fileSize: size,
        pageCount,
        filePath,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Log analytics
    await prisma.analytics.create({
      data: {
        userId,
        pdfId: pdf.id,
        eventType: 'PDF_UPLOAD',
        eventData: {
          filename: originalname,
          size,
          pageCount
        }
      }
    });

    res.status(201).json({
      success: true,
      pdf
    });
  } catch (error) {
    next(error);
  }
});

// Get user's PDFs
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 10, search } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      userId,
      isDeleted: false
    };

    if (search) {
      where.OR = [
        { originalName: { contains: search as string, mode: 'insensitive' } },
        { filename: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [pdfs, total] = await Promise.all([
      prisma.pdf.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              shares: true,
              versions: true
            }
          }
        }
      }),
      prisma.pdf.count({ where })
    ]);

    res.json({
      success: true,
      pdfs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get single PDF
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const pdf = await prisma.pdf.findFirst({
      where: {
        id,
        userId,
        isDeleted: false
      },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1
        },
        edits: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        shares: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!pdf) {
      throw new AppError('PDF not found', 404);
    }

    // Log view analytics
    await prisma.analytics.create({
      data: {
        userId,
        pdfId: pdf.id,
        eventType: 'PDF_VIEW'
      }
    });

    res.json({
      success: true,
      pdf
    });
  } catch (error) {
    next(error);
  }
});

// Download PDF
router.get('/:id/download', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const pdf = await prisma.pdf.findFirst({
      where: {
        id,
        userId,
        isDeleted: false
      }
    });

    if (!pdf) {
      throw new AppError('PDF not found', 404);
    }

    if (!fs.existsSync(pdf.filePath)) {
      throw new AppError('File not found on server', 404);
    }

    // Log download analytics
    await prisma.analytics.create({
      data: {
        userId,
        pdfId: pdf.id,
        eventType: 'PDF_DOWNLOAD'
      }
    });

    res.download(pdf.filePath, pdf.originalName);
  } catch (error) {
    next(error);
  }
});

// Delete PDF
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const pdf = await prisma.pdf.findFirst({
      where: {
        id,
        userId,
        isDeleted: false
      }
    });

    if (!pdf) {
      throw new AppError('PDF not found', 404);
    }

    // Soft delete
    await prisma.pdf.update({
      where: { id },
      data: { isDeleted: true }
    });

    res.json({
      success: true,
      message: 'PDF deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Edit PDF (save version)
router.post('/:id/edit', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { editType, editData, pageNumber } = req.body;
    const userId = req.user!.id;

    const pdf = await prisma.pdf.findFirst({
      where: {
        id,
        userId,
        isDeleted: false
      }
    });

    if (!pdf) {
      throw new AppError('PDF not found', 404);
    }

    // Create edit record
    const edit = await prisma.pDFEdit.create({
      data: {
        pdfId: id,
        editType,
        editData,
        pageNumber
      }
    });

    // Log edit analytics
    await prisma.analytics.create({
      data: {
        userId,
        pdfId: pdf.id,
        eventType: 'PDF_EDIT',
        eventData: { editType, pageNumber }
      }
    });

    res.json({
      success: true,
      edit
    });
  } catch (error) {
    next(error);
  }
});

export default router; 