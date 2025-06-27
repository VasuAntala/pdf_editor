'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface PDFData {
  _id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  pageCount: number;
  filePath: string;
  title: string;
  author: string;
  createdAt: string;
}

export default function EditorListPage() {
  const [pdfs, setPdfs] = useState<PDFData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPDFs = async () => {
      try {
        const apiUrl = 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/pdf`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch PDFs: ${response.status}`);
        }

        const data = await response.json();
        setPdfs(data.pdfs || []);
      } catch (error) {
        console.error('Error fetching PDFs:', error);
        toast.error(`Failed to load PDFs: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPDFs();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PDFs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">PDF Editor</h1>
            <Link
              href="/upload"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Upload New PDF
            </Link>
          </div>
        </div>
      </div>

      {/* PDF List */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your PDFs</h2>
        
        {pdfs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No PDFs found</h3>
            <p className="text-gray-600 mb-6">Upload your first PDF to get started</p>
            <Link
              href="/upload"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Upload PDF
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pdfs.map((pdf) => (
              <div key={pdf._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-blue-600 text-3xl">📄</div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {pdf.pageCount} page{pdf.pageCount !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2 truncate" title={pdf.originalName}>
                  {pdf.originalName}
                </h3>
                
                <div className="text-sm text-gray-600 mb-4">
                  <p>Author: {pdf.author || 'Unknown'}</p>
                  <p>Size: {(pdf.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                  <p>Created: {new Date(pdf.createdAt).toLocaleDateString()}</p>
                </div>
                
                <div className="flex gap-2">
                  <Link
                    href={`/editor/${pdf._id}`}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-lg transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={async () => {
                      try {
                        const apiUrl = 'http://localhost:5000/api';
                        const response = await fetch(`${apiUrl}/pdf/${pdf._id}/download`, {
                          headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                          }
                        });

                        if (!response.ok) {
                          throw new Error('Download failed');
                        }

                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = pdf.originalName;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                        
                        toast.success('PDF downloaded successfully!');
                      } catch (error) {
                        console.error('Download error:', error);
                        toast.error('Failed to download PDF');
                      }
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 