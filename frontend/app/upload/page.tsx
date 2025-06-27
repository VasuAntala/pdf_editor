'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

export default function UploadPage() {
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (!file.type.includes('pdf')) {
      toast.error('Please upload a PDF file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await fetch('http://localhost:5000/api/pdf/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      toast.success('PDF uploaded successfully!');
      router.push(`/editor/${data.pdf.id}`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload PDF. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [router]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Upload Your PDF
          </h1>
          
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400'
            }`}
          >
            <input {...getInputProps()} />
            
            <div className="text-6xl mb-4">📄</div>
            
            {uploading ? (
              <div className="text-lg text-gray-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                Uploading your PDF...
              </div>
            ) : (
              <div>
                <p className="text-lg text-gray-600 mb-4">
                  {isDragActive
                    ? 'Drop your PDF here'
                    : 'Drag & drop your PDF here, or click to select'
                  }
                </p>
                <p className="text-sm text-gray-500">
                  Supports PDF files up to 50MB
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 text-sm text-gray-600">
            <p>Need to edit a PDF? Upload it here and start editing immediately.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 