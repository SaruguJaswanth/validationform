# JL Learning Studio

A full-stack learning management system with advanced face detection authentication, built with React, Node.js, Express, and Supabase.

## 🚀 Features

- **Face Recognition Authentication**: Secure login using face detection technology
- **Role-Based Access Control**: Admin and student roles with appropriate permissions
- **Course Management**: Create, organize, and deliver multimedia courses
- **Progress Tracking**: Detailed analytics and progress monitoring
- **Admin Dashboard**: Comprehensive management tools for users and courses
- **Real-time Updates**: Live progress tracking and notifications
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **RESTful API**: Well-documented API endpoints with error handling

## 🛠 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Supabase** - Database and authentication
- **JWT** - Token-based authentication
- **Multer** - File upload handling
- **Express Validator** - Input validation
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **Tailwind CSS** - Utility-first CSS framework
- **Heroicons** - Icon library
- **face-api.js** - Face detection and recognition
- **react-webcam** - Camera integration
- **Axios** - HTTP client

### Database
- **PostgreSQL** (via Supabase) - Main database
- **Row Level Security** - Data protection
- **Real-time subscriptions** - Live updates

## 📁 Project Structure

```
jl-learning-studio/
├── client/                 # React frontend
│   ├── public/
│   │   ├── models/        # Face-api.js models
│   │   └── index.html
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utility functions
│   │   └── App.js
│   ├── package.json
│   └── tailwind.config.js
├── server/                # Node.js backend
│   ├── middleware/        # Express middleware
│   └── index.js
├── routes/                # API routes
│   ├── auth.js
│   ├── admin.js
│   ├── courses.js
│   └── user.js
├── config/                # Configuration files
│   └── supabase.js
├── database/              # Database schema
│   └── schema.sql
├── uploads/               # File uploads
├── .env.example          # Environment variables template
├── package.json
└── README.md
```

## 🔧 Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
cd jl-learning-studio
```

### 2. Install Dependencies

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Update the `.env` file with your Supabase credentials:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_min_32_chars
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,video/mp4,application/pdf
```

### 4. Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Copy and execute the SQL from `database/schema.sql`

### 5. Face Detection Models

Download the face-api.js models and place them in `client/public/models/`:

```bash
# Create models directory
mkdir -p client/public/models

# Download models (you'll need to get these from face-api.js repository)
# Place these files in client/public/models/:
# - tiny_face_detector_model-weights_manifest.json
# - tiny_face_detector_model-shard1
# - face_landmark_68_model-weights_manifest.json
# - face_landmark_68_model-shard1
# - face_recognition_model-weights_manifest.json
# - face_recognition_model-shard1
# - face_recognition_model-shard2
```

### 6. Start the Application

```bash
# Development mode (runs both client and server)
npm run dev

# Or run separately:
# Terminal 1 - Server
npm run server

# Terminal 2 - Client
npm run client
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📚 API Documentation

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/register` | Register new user | Public |
| POST | `/login` | Email/password login | Public |
| POST | `/face-login` | Face recognition login | Public |
| POST | `/setup-face` | Setup face recognition | Private |
| GET | `/profile` | Get user profile | Private |
| PUT | `/profile` | Update profile | Private |
| POST | `/logout` | Logout user | Private |

### Course Routes (`/api/courses`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get published courses | Public |
| GET | `/:id` | Get course details | Public |
| POST | `/:id/enroll` | Enroll in course | Student |
| GET | `/:id/progress` | Get course progress | Student |
| POST | `/:courseId/modules/:moduleId/progress` | Update progress | Student |

### Admin Routes (`/api/admin`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/dashboard` | Admin statistics | Admin |
| GET | `/courses` | Get all courses | Admin |
| POST | `/courses` | Create course | Admin |
| PUT | `/courses/:id` | Update course | Admin |
| DELETE | `/courses/:id` | Delete course | Admin |
| POST | `/courses/:courseId/modules` | Create module | Admin |
| POST | `/modules/:moduleId/content` | Add content | Admin |
| POST | `/upload` | Upload file | Admin |
| GET | `/users` | Get all users | Admin |
| PUT | `/users/:id` | Update user | Admin |

### User Routes (`/api/user`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/dashboard` | User dashboard data | Student |
| GET | `/courses` | User's courses | Student |
| GET | `/progress` | Learning progress | Student |
| GET | `/certificates` | User certificates | Student |
| GET | `/activity` | Activity history | Student |
| GET | `/recommendations` | Course recommendations | Student |

## 🔐 Authentication & Security

### JWT Authentication
- Stateless authentication using JWT tokens
- Token expiration and refresh handling
- Role-based access control (Admin/Student)

### Face Recognition
- Uses face-api.js for detection and recognition
- Stores face descriptors securely in database
- Euclidean distance matching for authentication
- Fallback to email/password authentication

### Security Features
- Helmet.js for security headers
- CORS protection
- Rate limiting
- Input validation and sanitization
- SQL injection prevention
- XSS protection

## 💾 Database Schema

### Key Tables

- **profiles** - User information and face data
- **courses** - Course information and metadata
- **modules** - Course modules and structure
- **module_content** - Individual content items
- **enrollments** - User course enrollments
- **user_progress** - Progress tracking
- **user_activity** - Activity logging
- **uploads** - File upload metadata

### Row Level Security (RLS)
All tables implement RLS policies to ensure data access control based on user roles and ownership.

## 🎨 Frontend Architecture

### Component Structure
- **Pages** - Route components
- **Components** - Reusable UI components
- **Contexts** - Global state management
- **Hooks** - Custom React hooks
- **Utils** - Utility functions

### State Management
- React Context for authentication
- React Query for server state
- Local state for component-specific data

### Styling
- Tailwind CSS for utility-first styling
- Custom CSS for specialized components
- Responsive design for all screen sizes

## 🚦 Getting Started (Quick Demo)

1. Start the application with `npm run dev`
2. Visit http://localhost:3000
3. Click "Sign up" to create an account
4. Choose "Student" or "Administrator" role
5. Complete registration
6. Optional: Set up Face ID for convenient login
7. Explore the dashboard and features

### Demo Accounts (Development)

- **Admin**: admin@example.com / admin123
- **Student**: student@example.com / student123

## 📝 Development Notes

### Face Detection Setup
The face detection feature requires downloading model files from the face-api.js repository. Place them in `client/public/models/` for the feature to work properly.

### Environment Variables
Ensure all required environment variables are set, especially Supabase credentials and JWT secret.

### Database Migrations
When updating the database schema, run the updated SQL in your Supabase SQL editor and restart the application.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🔮 Future Enhancements

- Video streaming for course content
- Real-time chat and discussions
- Mobile app development
- Advanced analytics dashboard
- Integration with external tools
- Multi-language support
- Offline course downloads
