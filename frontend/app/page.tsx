'use client';

import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Advanced PDF Editor
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Edit, annotate, and manage your PDF documents with powerful tools designed for professionals.
          </p>

          {user ? (
            // Authenticated user content
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Welcome back, {user.name}!
                </h2>
                <p className="text-gray-600 mb-6">
                  Ready to work on your PDFs? Upload a new document or continue editing your existing files.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    href="/upload" 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                  >
                    Upload New PDF
                  </Link>
                  <Link 
                    href="/editor" 
                    className="bg-white hover:bg-gray-50 text-blue-600 font-semibold py-3 px-8 rounded-lg border-2 border-blue-600 transition-colors"
                  >
                    View My PDFs
                  </Link>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-3xl mb-4">📄</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload & Edit</h3>
                  <p className="text-gray-600">Upload your PDF files and start editing immediately with our intuitive tools.</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-3xl mb-4">✏️</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Editing</h3>
                  <p className="text-gray-600">Edit text, add annotations, insert images, and more with our comprehensive editing suite.</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-3xl mb-4">💾</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Storage</h3>
                  <p className="text-gray-600">Your documents are securely stored and accessible from anywhere, anytime.</p>
                </div>
              </div>
            </div>
          ) : (
            // Unauthenticated user content
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link 
                  href="/auth/register" 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                >
                  Get Started Free
                </Link>
                <Link 
                  href="/auth/login" 
                  className="bg-white hover:bg-gray-50 text-blue-600 font-semibold py-3 px-8 rounded-lg border-2 border-blue-600 transition-colors"
                >
                  Sign In
                </Link>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-3xl mb-4">🚀</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast & Easy</h3>
                  <p className="text-gray-600">Upload and start editing your PDFs in seconds with our streamlined interface.</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-3xl mb-4">🔒</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure & Private</h3>
                  <p className="text-gray-600">Your documents are encrypted and secure. We never share your data with third parties.</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-3xl mb-4">💡</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Powerful Features</h3>
                  <p className="text-gray-600">Advanced editing tools, collaboration features, and cloud storage all in one place.</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-8 mt-12">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Why Choose Our PDF Editor?
                </h2>
                <div className="grid md:grid-cols-2 gap-6 text-left">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Professional Tools</h4>
                    <p className="text-gray-600">Access to advanced editing features used by professionals worldwide.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Cloud Storage</h4>
                    <p className="text-gray-600">Access your documents from any device, anywhere in the world.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Collaboration</h4>
                    <p className="text-gray-600">Share documents with team members and collaborate in real-time.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">24/7 Support</h4>
                    <p className="text-gray-600">Get help whenever you need it with our round-the-clock customer support.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 