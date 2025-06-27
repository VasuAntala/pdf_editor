# Advanced PDF Editor

A comprehensive PDF editing platform built with Next.js, Node.js, and PostgreSQL. Features include user authentication, PDF upload/editing, conversion, sharing, and analytics.

## 🚀 Features

### Core PDF Editing
- **Text Editing**: Add, edit, and format text on PDF pages
- **Image Manipulation**: Add, remove, resize, and edit images
- **Page Management**: Add, remove, reorder, and rotate pages
- **Merge & Split**: Combine multiple PDFs or split into separate files
- **Undo/Redo**: Full editing history with undo/redo functionality

### File Operations
- **Upload & Validation**: Secure PDF upload with file validation
- **Conversion**: Convert PDFs to Word, Excel, PowerPoint formats
- **Download**: Save edited PDFs in various formats
- **Sharing**: Generate shareable links with expiration and download limits

### User Management
- **Authentication**: JWT-based authentication with Google OAuth
- **User Profiles**: Manage user information and preferences
- **Role-based Access**: Admin, Premium, and User roles
- **Session Management**: Secure session handling

### Analytics & Insights
- **Usage Analytics**: Track PDF views, downloads, and edits
- **User Behavior**: Monitor user engagement and patterns
- **Performance Metrics**: File processing statistics
- **Custom Events**: Track custom user interactions

### Monetization
- **Ad Integration**: Banner, sidebar, and inline advertisements
- **Premium Features**: Advanced editing tools for premium users
- **Analytics Dashboard**: Detailed insights for administrators

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** - Server state management
- **React Hook Form** - Form handling
- **PDF-lib** - PDF manipulation library
- **Fabric.js** - Canvas-based editing

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **TypeScript** - Type-safe development
- **Prisma** - Database ORM
- **PostgreSQL** - Primary database
- **JWT** - Authentication
- **Passport.js** - OAuth authentication
- **Multer** - File upload handling

### Infrastructure
- **PostgreSQL** - Relational database
- **Redis** - Caching (optional)
- **AWS S3** - File storage (optional)
- **Docker** - Containerization

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd pdf_editor
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Database Setup
```bash
# Navigate to backend directory
cd backend

# Copy environment variables
cp env.example .env

# Update .env with your database credentials
DATABASE_URL="postgresql://username:password@localhost:5432/pdf_editor"
JWT_SECRET="your-super-secret-jwt-key-here"

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

### 4. Environment Configuration

#### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/pdf_editor"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# File Upload
MAX_FILE_SIZE=52428800
UPLOAD_PATH="./uploads"
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id"
```

### 5. Start Development Servers
```bash
# From root directory
npm run dev

# Or start individually
npm run dev:backend  # Backend on port 5000
npm run dev:frontend # Frontend on port 3000
```

## 🏗️ Project Structure

```
pdf_editor/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── utils/          # Utility functions
│   │   └── index.ts        # Server entry point
│   ├── prisma/             # Database schema
│   └── uploads/            # File uploads
├── frontend/               # Next.js application
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   ├── lib/              # Utility libraries
│   ├── hooks/            # Custom React hooks
│   └── types/            # TypeScript types
└── package.json          # Root package.json
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### PDF Management
- `POST /api/pdf/upload` - Upload PDF
- `GET /api/pdf` - Get user's PDFs
- `GET /api/pdf/:id` - Get specific PDF
- `GET /api/pdf/:id/download` - Download PDF
- `DELETE /api/pdf/:id` - Delete PDF
- `POST /api/pdf/:id/edit` - Save PDF edit

### Sharing
- `POST /api/share/create` - Create share link
- `GET /api/share/:token` - Get shared PDF
- `GET /api/share/:token/download` - Download shared PDF

### Analytics
- `GET /api/analytics/dashboard` - Analytics dashboard
- `GET /api/analytics/pdf/:pdfId` - PDF-specific analytics
- `POST /api/analytics/track` - Track custom event

## 🎨 UI Components

### Core Components
- **PDFViewer** - PDF display and navigation
- **PDFEditor** - Canvas-based editing interface
- **Toolbar** - Editing tools and controls
- **Sidebar** - File management and properties
- **UploadZone** - Drag-and-drop file upload

### Authentication
- **LoginForm** - User login interface
- **RegisterForm** - User registration
- **GoogleAuth** - OAuth integration

### Management
- **Dashboard** - User dashboard with statistics
- **FileManager** - PDF file management
- **ShareManager** - Link sharing interface
- **Analytics** - Usage analytics and reports

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Input Validation** - Server-side validation
- **File Upload Security** - File type and size validation
- **Rate Limiting** - API request throttling
- **CORS Configuration** - Cross-origin security
- **SQL Injection Prevention** - Prisma ORM protection

## 📊 Analytics & Monitoring

### User Analytics
- Page views and session tracking
- PDF upload and download statistics
- User engagement metrics
- Feature usage patterns

### Performance Monitoring
- API response times
- File processing metrics
- Error tracking and logging
- Database query optimization

## 🚀 Deployment

### Production Build
```bash
# Build both frontend and backend
npm run build

# Start production servers
npm start
```

### Docker Deployment
```bash
# Build Docker images
docker-compose build

# Start services
docker-compose up -d
```

### Environment Variables
Ensure all production environment variables are set:
- Database connection strings
- JWT secrets
- OAuth credentials
- File storage configuration
- Analytics tracking IDs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API reference

## 🔄 Roadmap

- [ ] Real-time collaboration
- [ ] Advanced OCR capabilities
- [ ] Mobile app development
- [ ] AI-powered editing suggestions
- [ ] Enterprise features
- [ ] Advanced analytics dashboard 