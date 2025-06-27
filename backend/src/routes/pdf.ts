import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { PDFDocument } from 'pdf-lib';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';
import { pdfOperations } from '../utils/pdfOperations';
import { PDF } from '../models/PDF';
import { Analytics } from '../models/Analytics';

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

// Upload PDF with enhanced pdf-lib processing (temporarily without auth for testing)
router.post('/upload', upload.single('pdf'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const { originalname, filename, size, path: filePath } = req.file;
    const userId = req.body.userId || null; // Make userId optional for testing

    // Validate file size (50MB limit)
    if (size > 50 * 1024 * 1024) {
      // Delete uploaded file if too large
      fs.unlinkSync(filePath);
      throw new AppError('File size exceeds 50MB limit', 400);
    }

    // Process PDF with pdf-lib for validation and metadata
    let pdfInfo;
    let pageCount = 0;
    let isValidPDF = false;

    try {
      const pdfBytes = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Extract comprehensive PDF information
      pdfInfo = {
        pageCount: pdfDoc.getPageCount(),
        title: pdfDoc.getTitle() || originalname,
        author: pdfDoc.getAuthor() || 'Unknown',
        subject: pdfDoc.getSubject() || '',
        creator: pdfDoc.getCreator() || 'PDF Editor',
        producer: pdfDoc.getProducer() || 'pdf-lib',
        creationDate: pdfDoc.getCreationDate() || new Date(),
        modificationDate: pdfDoc.getModificationDate() || new Date(),
        keywords: pdfDoc.getKeywords() || [],
        isEncrypted: pdfDoc.isEncrypted,
      };

      pageCount = pdfInfo.pageCount;
      isValidPDF = true;

    } catch (pdfError) {
      // Delete uploaded file if it's not a valid PDF
      fs.unlinkSync(filePath);
      throw new AppError('Invalid PDF file or corrupted PDF', 400);
    }

    if (!isValidPDF) {
      fs.unlinkSync(filePath);
      throw new AppError('Invalid PDF file', 400);
    }

    // Create PDF record with enhanced metadata
    const pdfData: any = {
      filename,
      originalName: originalname,
      fileSize: size,
      pageCount,
      filePath,
      title: pdfInfo.title,
      author: pdfInfo.author,
      subject: pdfInfo.subject,
      creator: pdfInfo.creator,
      producer: pdfInfo.producer,
      creationDate: pdfInfo.creationDate,
      modificationDate: pdfInfo.modificationDate,
      isEncrypted: pdfInfo.isEncrypted
    };

    // Only add userId if it's provided and valid
    if (userId) {
      pdfData.userId = userId;
    }

    const pdf = new PDF(pdfData);
    await pdf.save();

    // Log analytics with enhanced data (only if userId is provided)
    if (userId) {
      await Analytics.create({
        userId,
        pdfId: pdf._id,
        eventType: 'PDF_UPLOAD',
        eventData: {
          filename: originalname,
          size,
          pageCount,
          title: pdfInfo.title,
          author: pdfInfo.author,
          isEncrypted: pdfInfo.isEncrypted
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'PDF uploaded successfully',
      pdf: {
        ...pdf.toObject(),
        info: pdfInfo
      }
    });

  } catch (error) {
    // Log the error properly
    logger.error('PDF upload error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      file: req.file ? {
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      } : 'No file'
    });

    // Clean up uploaded file if there's an error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        logger.error('Failed to cleanup uploaded file:', {
          error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
          stack: cleanupError instanceof Error ? cleanupError.stack : undefined
        });
      }
    }
    next(error);
  }
});

// Upload multiple PDFs
router.post('/upload-multiple', upload.array('pdfs', 10), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new AppError('No files uploaded', 400);
    }

    const userId = req.user!.id;
    const uploadedPdfs = [];
    const errors = [];

    for (const file of req.files as Express.Multer.File[]) {
      try {
        const { originalname, filename, size, path: filePath } = file;

        // Validate file size
        if (size > 50 * 1024 * 1024) {
          fs.unlinkSync(filePath);
          errors.push({ filename: originalname, error: 'File size exceeds 50MB limit' });
          continue;
        }

        // Process PDF with pdf-lib
        let pdfInfo;
        let pageCount = 0;

        try {
          const pdfBytes = fs.readFileSync(filePath);
          const pdfDoc = await PDFDocument.load(pdfBytes);
          
          pdfInfo = {
            pageCount: pdfDoc.getPageCount(),
            title: pdfDoc.getTitle() || originalname,
            author: pdfDoc.getAuthor() || 'Unknown',
            subject: pdfDoc.getSubject() || '',
            creator: pdfDoc.getCreator() || 'PDF Editor',
            producer: pdfDoc.getProducer() || 'pdf-lib',
            creationDate: pdfDoc.getCreationDate() || new Date(),
            modificationDate: pdfDoc.getModificationDate() || new Date(),
            isEncrypted: pdfDoc.isEncrypted,
          };

          pageCount = pdfInfo.pageCount;

        } catch (pdfError) {
          fs.unlinkSync(filePath);
          errors.push({ filename: originalname, error: 'Invalid PDF file' });
          continue;
        }

        // Create PDF record
        const pdf = new PDF({
          filename,
          originalName: originalname,
          fileSize: size,
          pageCount,
          filePath,
          userId,
          title: pdfInfo.title,
          author: pdfInfo.author,
          subject: pdfInfo.subject,
          creator: pdfInfo.creator,
          producer: pdfInfo.producer,
          creationDate: pdfInfo.creationDate,
          modificationDate: pdfInfo.modificationDate,
          isEncrypted: pdfInfo.isEncrypted
        });

        await pdf.save();
        uploadedPdfs.push({ ...pdf.toObject(), info: pdfInfo });

        // Log analytics
        await Analytics.create({
          userId,
          pdfId: pdf._id,
          eventType: 'PDF_UPLOAD',
          eventData: {
            filename: originalname,
            size,
            pageCount,
            title: pdfInfo.title
          }
        });

      } catch (error) {
        errors.push({ filename: file.originalname, error: error.message });
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully uploaded ${uploadedPdfs.length} PDF(s)`,
      uploadedPdfs,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    // Clean up uploaded files if there's an error
    if (req.files) {
      for (const file of req.files as Express.Multer.File[]) {
        if (fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (cleanupError) {
            logger.error('Failed to cleanup uploaded file:', cleanupError);
          }
        }
      }
    }
    next(error);
  }
});

// Get all PDFs for a user
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.query.userId as string;
    const query: any = {};
    
    if (userId) {
      query.userId = userId;
    }
    
    const pdfs = await PDF.find(query).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      pdfs
    });
  } catch (error) {
    next(error);
  }
});

// Get a specific PDF by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pdf = await PDF.findById(req.params.id);
    
    if (!pdf) {
      throw new AppError('PDF not found', 404);
    }
    
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

    const pdf = await PDF.findById(id);

    if (!pdf) {
      throw new AppError('PDF not found', 404);
    }

    // Log download analytics
    await Analytics.create({
      userId,
      pdfId: pdf._id,
      eventType: 'PDF_DOWNLOAD'
    });

    res.download(pdf.filePath, pdf.originalName);
  } catch (error) {
    next(error);
  }
});

// View PDF in browser
router.get('/:id/view', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const pdf = await PDF.findById(id);

    if (!pdf) {
      throw new AppError('PDF not found', 404);
    }

    // Check if file exists
    if (!fs.existsSync(pdf.filePath)) {
      throw new AppError('PDF file not found on server', 404);
    }

    // Set headers for PDF viewing in browser
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${pdf.originalName}"`);
    
    // Stream the PDF file
    const fileStream = fs.createReadStream(pdf.filePath);
    fileStream.pipe(res);

  } catch (error) {
    next(error);
  }
});

// Delete a PDF
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pdf = await PDF.findById(req.params.id);
    
    if (!pdf) {
      throw new AppError('PDF not found', 404);
    }
    
    // Delete the file from filesystem
    if (fs.existsSync(pdf.filePath)) {
      fs.unlinkSync(pdf.filePath);
    }
    
    // Delete from database
    await PDF.findByIdAndDelete(req.params.id);
    
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

    const pdf = await PDF.findById(id);

    if (!pdf) {
      throw new AppError('PDF not found', 404);
    }

    // Create edit record
    const edit = {
      pdfId: id,
      editType,
      editData,
      pageNumber
    };

    await Analytics.create({
      userId,
      pdfId: id,
      eventType: 'PDF_EDIT',
      eventData: { editType, pageNumber }
    });

    res.json({
      success: true,
      edit
    });
  } catch (error) {
    next(error);
  }
});

// Add text to PDF
router.post('/:id/add-text', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { text, x, y, fontSize, color, pageNumber } = req.body;

    // Get PDF
    const pdf = await PDF.findById(id);

    if (!pdf) {
      throw new AppError('PDF not found', 404);
    }

    // Add text to PDF
    const editedFilePath = await pdfOperations.addTextToPDF(pdf.filePath, {
      text,
      x,
      y,
      fontSize,
      color,
      pageNumber
    });

    // Create new PDF record for edited version
    const editedPdf = new PDF({
      filename: `edited_${pdf.filename}`,
      originalName: `edited_${pdf.originalName}`,
      fileSize: fs.statSync(editedFilePath).size,
      pageCount: pdf.pageCount,
      filePath: editedFilePath,
      userId,
      isEdited: true
    });

    await editedPdf.save();

    // Log edit analytics
    await Analytics.create({
      userId,
      pdfId: editedPdf._id,
      eventType: 'PDF_EDIT',
      eventData: { editType: 'add_text', pageNumber }
    });

    res.json({
      success: true,
      originalPdf: pdf,
      editedPdf
    });
  } catch (error) {
    next(error);
  }
});

// Merge PDFs
router.post('/merge', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { pdfIds, outputName } = req.body;

    if (!pdfIds || !Array.isArray(pdfIds) || pdfIds.length < 2) {
      throw new AppError('At least 2 PDF IDs are required for merging', 400);
    }

    // Get PDF file paths
    const pdfPaths: string[] = [];
    for (const pdfId of pdfIds) {
      const pdf = await PDF.findById(pdfId);
      if (!pdf) {
        throw new AppError(`PDF with ID ${pdfId} not found`, 404);
      }
      pdfPaths.push(pdf.filePath);
    }

    // Merge PDFs
    const mergedFilePath = await pdfOperations.mergePDFs(pdfPaths, outputName);

    // Create new PDF record for merged version
    const mergedPdf = new PDF({
      filename: outputName || `merged_${Date.now()}.pdf`,
      originalName: outputName || `merged_${Date.now()}.pdf`,
      fileSize: fs.statSync(mergedFilePath).size,
      pageCount: 0, // Will be updated below
      filePath: mergedFilePath,
      userId,
      isMerged: true
    });

    await mergedPdf.save();

    // Get page count of merged PDF
    const mergedPdfInfo = await pdfOperations.getPDFInfo(mergedFilePath);
    await PDF.findByIdAndUpdate(mergedPdf._id, { pageCount: mergedPdfInfo.pageCount });

    // Log merge analytics
    await Analytics.create({
      userId,
      eventType: 'PDF_MERGE',
      eventData: { pdfIds, outputName }
    });

    res.json({
      success: true,
      mergedPdf: {
        ...mergedPdf.toObject(),
        pageCount: mergedPdfInfo.pageCount
      }
    });
  } catch (error) {
    next(error);
  }
});

// Split PDF
router.post('/:id/split', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { pageRanges, outputNames } = req.body;

    if (!pageRanges || !Array.isArray(pageRanges) || pageRanges.length === 0) {
      throw new AppError('Page ranges are required for splitting', 400);
    }

    // Get PDF
    const pdf = await PDF.findById(id);

    if (!pdf) {
      throw new AppError('PDF not found', 404);
    }

    // Split PDF
    const splitFilePaths = await pdfOperations.splitPDF(pdf.filePath, pageRanges);

    // Create new PDF records for split versions
    const splitPdfs = [];
    for (let i = 0; i < splitFilePaths.length; i++) {
      const splitFilePath = splitFilePaths[i];
      const splitStats = fs.statSync(splitFilePath);
      const splitFilename = path.basename(splitFilePath);
      
      const splitPdf = new PDF({
        filename: outputNames?.[i] || `split_${i + 1}_${pdf.originalName}`,
        originalName: outputNames?.[i] || `split_${i + 1}_${pdf.originalName}`,
        fileSize: splitStats.size,
        pageCount: 0, // Will be updated below
        filePath: splitFilePath,
        userId,
        isSplit: true
      });

      await splitPdf.save();

      // Get page count of split PDF
      const splitPdfInfo = await pdfOperations.getPDFInfo(splitFilePath);
      await PDF.findByIdAndUpdate(splitPdf._id, { pageCount: splitPdfInfo.pageCount });

      splitPdfs.push({
        ...splitPdf.toObject(),
        pageCount: splitPdfInfo.pageCount
      });
    }

    // Log split analytics
    await Analytics.create({
      userId,
      pdfId: pdf._id,
      eventType: 'PDF_SPLIT',
      eventData: { pageRanges, outputNames }
    });

    res.json({
      success: true,
      originalPdf: pdf,
      splitPdfs
    });
  } catch (error) {
    next(error);
  }
});

// Get PDF metadata
router.get('/:id/metadata', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const pdf = await PDF.findById(id);

    if (!pdf) {
      throw new AppError('PDF not found', 404);
    }

    // Get detailed PDF info using pdf-lib
    const pdfInfo = await pdfOperations.getPDFInfo(pdf.filePath);

    res.json({
      success: true,
      metadata: {
        ...pdf.toObject(),
        detailedInfo: pdfInfo
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router; 