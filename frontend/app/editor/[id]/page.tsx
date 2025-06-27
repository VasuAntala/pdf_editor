'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/components/providers/AuthProvider';

interface PDFData {
  id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  pageCount: number;
  filePath: string;
  thumbnailPath?: string;
}

export default function EditorPage() {
  const params = useParams();
  const [pdf, setPdf] = useState<PDFData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchPDF = async () => {
      try {
        const pdfId = params?.id as string;
        if (!pdfId) {
          throw new Error('PDF ID is required');
        }

        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/pdf/${pdfId}`, {
          headers: {
            'Authorization': `Bearer ${token || ''}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch PDF');
        }

        const data = await response.json();
        setPdf(data.pdf);
        setPdfUrl(`http://localhost:5000/api/pdf/${pdfId}/view`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load PDF');
      } finally {
        setLoading(false);
      }
    };

    fetchPDF();
  }, [params?.id]);

  const handleDownload = async () => {
    try {
      const pdfId = params?.id as string;
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/pdf/${pdfId}/download`, {
        headers: {
          'Authorization': `Bearer ${token || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdf?.originalName || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!pdf) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">PDF Not Found</h1>
            <p className="text-gray-600">The PDF you're looking for doesn't exist or you don't have permission to access it.</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-lg font-medium text-gray-900">
                  {pdf.originalName}
                </h1>
                <span className="text-sm text-gray-500">
                  {pdf.pageCount} pages • {(pdf.fileSize / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Editing as {user?.name}
                </span>
                <button
                  onClick={handleDownload}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="aspect-[3/4] w-full">
              <iframe
                src={pdfUrl}
                className="w-full h-full rounded-lg"
                title={pdf.originalName}
              />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 