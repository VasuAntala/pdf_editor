import { PDFDocument, PDFPage, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from './AppError';
import { logger } from './logger';

export interface PDFEditOptions {
  text?: string;
  x?: number;
  y?: number;
  fontSize?: number;
  color?: { r: number; g: number; b: number };
  pageNumber?: number;
}

export class PDFOperations {
  private uploadDir = 'uploads/pdfs';
  private tempDir = 'uploads/temp';

  constructor() {
    this.ensureDirectories();
  }

  private ensureDirectories() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async addTextToPDF(filePath: string, options: PDFEditOptions): Promise<string> {
    try {
      const pdfBytes = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      const pages = pdfDoc.getPages();
      const pageIndex = (options.pageNumber || 1) - 1;
      
      if (pageIndex < 0 || pageIndex >= pages.length) {
        throw new AppError('Invalid page number', 400);
      }

      const page = pages[pageIndex];
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      const fontSize = options.fontSize || 12;
      const color = options.color || { r: 0, g: 0, b: 0 };
      const x = options.x || 50;
      const y = options.y || page.getHeight() - 50;

      page.drawText(options.text || 'Sample Text', {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
      });

      const modifiedPdfBytes = await pdfDoc.save();
      const outputPath = path.join(this.uploadDir, `edited-${uuidv4()}.pdf`);
      fs.writeFileSync(outputPath, modifiedPdfBytes);

      return outputPath;
    } catch (error) {
      logger.error('Error adding text to PDF:', error);
      throw new AppError('Failed to add text to PDF', 500);
    }
  }

  async mergePDFs(pdfPaths: string[], outputName?: string): Promise<string> {
    try {
      const mergedPdf = await PDFDocument.create();
      
      for (const pdfPath of pdfPaths) {
        if (!fs.existsSync(pdfPath)) {
          throw new AppError(`PDF file not found: ${pdfPath}`, 404);
        }
        
        const pdfBytes = fs.readFileSync(pdfPath);
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const outputPath = path.join(this.uploadDir, outputName || `merged-${uuidv4()}.pdf`);
      fs.writeFileSync(outputPath, mergedPdfBytes);

      return outputPath;
    } catch (error) {
      logger.error('Error merging PDFs:', error);
      throw new AppError('Failed to merge PDFs', 500);
    }
  }

  async splitPDF(filePath: string, pageRanges: number[][]): Promise<string[]> {
    try {
      const pdfBytes = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const totalPages = pdfDoc.getPageCount();
      
      const outputPaths: string[] = [];
      
      for (let i = 0; i < pageRanges.length; i++) {
        const range = pageRanges[i];
        const startPage = range[0];
        const endPage = range[1] || range[0];
        
        if (startPage < 1 || endPage > totalPages || startPage > endPage) {
          throw new AppError(`Invalid page range: ${startPage}-${endPage}`, 400);
        }
        
        const splitPdf = await PDFDocument.create();
        const pageIndices = [];
        
        for (let j = startPage - 1; j < endPage; j++) {
          pageIndices.push(j);
        }
        
        const copiedPages = await splitPdf.copyPages(pdfDoc, pageIndices);
        copiedPages.forEach((page) => splitPdf.addPage(page));
        
        const splitPdfBytes = await splitPdf.save();
        const outputPath = path.join(this.uploadDir, `split-${i + 1}-${uuidv4()}.pdf`);
        fs.writeFileSync(outputPath, splitPdfBytes);
        outputPaths.push(outputPath);
      }

      return outputPaths;
    } catch (error) {
      logger.error('Error splitting PDF:', error);
      throw new AppError('Failed to split PDF', 500);
    }
  }

  async getPDFInfo(filePath: string) {
    try {
      const pdfBytes = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      return {
        pageCount: pdfDoc.getPageCount(),
        title: pdfDoc.getTitle(),
        author: pdfDoc.getAuthor(),
        subject: pdfDoc.getSubject(),
        creator: pdfDoc.getCreator(),
        producer: pdfDoc.getProducer(),
        creationDate: pdfDoc.getCreationDate(),
        modificationDate: pdfDoc.getModificationDate(),
      };
    } catch (error) {
      logger.error('Error getting PDF info:', error);
      throw new AppError('Failed to get PDF information', 500);
    }
  }

  async deletePDF(filePath: string): Promise<boolean> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error deleting PDF:', error);
      throw new AppError('Failed to delete PDF', 500);
    }
  }
}

export const pdfOperations = new PDFOperations();
