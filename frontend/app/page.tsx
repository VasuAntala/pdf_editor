import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Advanced PDF Editor
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Edit, convert, and manage your PDFs with our powerful online PDF editor. 
            Support for text editing, image manipulation, merging, splitting, and more.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link 
              href="/editor" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              Start Editing
            </Link>
            <Link 
              href="/upload" 
              className="bg-white hover:bg-gray-50 text-blue-600 font-semibold py-3 px-8 rounded-lg border-2 border-blue-600 transition-colors"
            >
              Upload PDF
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 text-3xl mb-4">✏️</div>
              <h3 className="text-xl font-semibold mb-2">Edit Text & Images</h3>
              <p className="text-gray-600">
                Modify text content, add or remove images, and adjust layouts with our intuitive editor.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 text-3xl mb-4">🔄</div>
              <h3 className="text-xl font-semibold mb-2">Convert Formats</h3>
              <p className="text-gray-600">
                Convert PDFs to Word, Excel, PowerPoint, and other popular formats.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 text-3xl mb-4">📎</div>
              <h3 className="text-xl font-semibold mb-2">Merge & Split</h3>
              <p className="text-gray-600">
                Combine multiple PDFs into one or split large documents into smaller files.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 