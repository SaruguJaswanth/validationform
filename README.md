# JL Learning Studio

A modern, fullstack learning management system built with Node.js, React, and Supabase. Features include user authentication, course management, progress tracking, and admin panels.

![JL Learning Studio](https://img.shields.io/badge/Learning%20Management%20System-v1.0.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-v18+-green)
![React](https://img.shields.io/badge/React-v18+-blue)
![Supabase](https://img.shields.io/badge/Supabase-enabled-green)

## Features

### 🔐 Authentication & Authorization
- **Supabase Auth Integration**: Secure email/password authentication
- **JWT-based Sessions**: Server-side token validation
- **Role-based Access Control**: Student and Admin roles
- **Protected Routes**: Route-level authorization
- **Face Detection Support**: Ready for face authentication integration

### 📚 Course Management
- **Course Creation**: Rich course content with images and videos
- **Module System**: Organized learning modules with video content
- **Progress Tracking**: Real-time learning progress monitoring
- **Course Categories**: Organized by subject and difficulty
- **Enrollment System**: Student course enrollment and management

### 👨‍💼 Admin Panel
- **Dashboard Analytics**: User and course statistics
- **Course Management**: Create, edit, and publish courses
- **User Management**: View and manage all users
- **File Upload System**: Image and video content upload
- **Module Management**: Create and organize course modules

### 👨‍🎓 Student Dashboard
- **Personal Dashboard**: Course progress and enrolled courses
- **Course Catalog**: Browse and enroll in available courses
- **Progress Tracking**: Module-level completion tracking
- **Profile Management**: Update personal information

## Tech Stack

### Backend
- **Node.js + Express**: RESTful API server
- **Supabase**: Database and authentication
- **JWT**: Token-based authentication
- **Multer**: File upload handling
- **Helmet**: Security middleware
- **CORS**: Cross-origin resource sharing

### Frontend
- **React 18**: Modern React with hooks
- **React Router v6**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **React Hook Form**: Form management
- **React Hot Toast**: Notification system
- **Lucide React**: Icon library

### Database
- **PostgreSQL**: Supabase-managed database
- **Row Level Security**: Built-in data protection
- **Real-time subscriptions**: Live data updates

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/jl-learning-studio.git
   cd jl-learning-studio
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   npm run install-server
   
   # Install client dependencies
   npm run install-client
   
   # Or install all at once
   npm run install-all
   ```

3. **Set up Supabase**
   
   a. Create a new project at [supabase.com](https://supabase.com)
   
   b. Go to Settings > API to get your keys
   
   c. Run the database schema:
   - Go to SQL Editor in your Supabase dashboard
   - Copy and run the contents of `docs/database-schema.sql`

4. **Environment Setup**
   
   Copy the environment template and fill in your values:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Supabase credentials:
   ```env
   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=24h
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # CORS Configuration
   CLIENT_URL=http://localhost:3000
   ```

5. **Create client environment file**
   ```bash
   # Create client/.env
   echo "REACT_APP_API_URL=http://localhost:5000/api" > client/.env
   ```

6. **Start the development servers**
   ```bash
   # Start both frontend and backend
   npm run dev:full
   
   # Or start them separately:
   # Terminal 1 - Backend
   npm run server
   
   # Terminal 2 - Frontend  
   npm run client
   ```

7. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api

### Creating an Admin User

After setting up the database, you'll need to create an admin user:

1. Register a new user through the frontend at `/register`
2. Find the user's UUID in your Supabase Auth dashboard
3. Update the user's role in the `profiles` table:
   ```sql
   UPDATE profiles 
   SET role = 'admin' 
   WHERE email = 'your-admin-email@example.com';
   ```

## Project Structure

```
jl-learning-studio/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── contexts/       # React contexts (Auth, etc.)
│   │   ├── pages/          # Route components
│   │   ├── services/       # API service layer
│   │   └── utils/          # Utility functions
│   ├── package.json
│   └── tailwind.config.js
├── server/                 # Node.js backend
│   ├── config/            # Database configuration
│   ├── controllers/       # Route handlers
│   ├── middleware/        # Custom middleware
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── utils/            # Utility functions
│   └── server.js         # Main server file
├── docs/                 # Documentation
│   └── database-schema.sql
├── uploads/              # File uploads (auto-created)
├── .env.example         # Environment template
├── .gitignore
├── package.json         # Root package.json
└── README.md
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - User logout

### Course Endpoints

- `GET /api/courses` - List published courses
- `GET /api/courses/:id` - Get course details
- `GET /api/courses/my-courses` - Get user's enrolled courses
- `POST /api/courses/:id/enroll` - Enroll in course
- `PUT /api/courses/:courseId/modules/:moduleId/progress` - Update progress

### Admin Endpoints

- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - List all users
- `GET /api/admin/courses` - List all courses
- `POST /api/admin/courses` - Create new course
- `PUT /api/admin/courses/:id` - Update course
- `DELETE /api/admin/courses/:id` - Delete course
- `POST /api/admin/courses/:courseId/modules` - Create module
- `PUT /api/admin/modules/:id` - Update module
- `DELETE /api/admin/modules/:id` - Delete module
- `POST /api/admin/upload` - Upload files

## Database Schema

The application uses the following main tables:

- **profiles** - User profiles extending Supabase auth
- **courses** - Course information and metadata
- **modules** - Course modules and content
- **course_enrollments** - User course enrollments
- **user_progress** - Module-level progress tracking

See `docs/database-schema.sql` for the complete schema.

## Scripts

```bash
# Development
npm run dev          # Start backend only
npm run client       # Start frontend only  
npm run dev:full     # Start both frontend and backend

# Production
npm start           # Start backend in production mode
npm run build       # Build frontend for production

# Installation
npm run install-server  # Install backend dependencies
npm run install-client  # Install frontend dependencies
npm run install-all     # Install all dependencies
```

## Environment Variables

### Server (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `JWT_SECRET` | Secret for JWT token signing | Yes |
| `JWT_EXPIRES_IN` | JWT token expiration time | No (default: 24h) |
| `PORT` | Server port | No (default: 5000) |
| `NODE_ENV` | Environment mode | No (default: development) |
| `CLIENT_URL` | Frontend URL for CORS | No (default: http://localhost:3000) |

### Client (client/.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_API_URL` | Backend API URL | No (default: /api) |

## Deployment

### Backend Deployment

1. Set environment variables on your hosting platform
2. Ensure database schema is applied to production Supabase
3. Deploy with `npm start`

### Frontend Deployment

1. Build the frontend: `cd client && npm run build`
2. Deploy the `build` folder to your static hosting service
3. Configure environment variables for production API URL

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Row Level Security**: Database-level access control
- **Input Validation**: Server-side data validation
- **CORS Protection**: Configured cross-origin policies
- **Rate Limiting**: API request rate limiting
- **Helmet Security**: Security headers middleware
- **File Upload Validation**: Secure file upload handling

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@jlstudio.com or create an issue in the GitHub repository.

## Acknowledgments

- Built with [Supabase](https://supabase.com) for backend infrastructure
- UI components styled with [Tailwind CSS](https://tailwindcss.com)
- Icons provided by [Lucide](https://lucide.dev)
- Face detection integration ready for [MediaPipe](https://mediapipe.dev) or similar libraries
