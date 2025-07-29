# JL Learning Studio - Detailed Setup Guide

This guide provides step-by-step instructions for setting up the JL Learning Studio application.

## 📋 Prerequisites Checklist

- [ ] Node.js v16+ installed
- [ ] npm or yarn package manager
- [ ] Git installed
- [ ] Supabase account created
- [ ] Code editor (VS Code recommended)
- [ ] Modern web browser with camera support

## 🏗️ Step-by-Step Setup

### Step 1: Project Setup

```bash
# Clone the repository
git clone <repository-url>
cd jl-learning-studio

# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### Step 2: Supabase Configuration

#### 2.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/login to your account
3. Click "New Project"
4. Choose your organization
5. Enter project name: "JL Learning Studio"
6. Generate a strong database password
7. Select a region close to your users
8. Click "Create new project"

#### 2.2 Get Supabase Credentials
1. Go to Project Settings → API
2. Copy the following values:
   - Project URL
   - Project API keys (anon/public and service_role)

#### 2.3 Configure Database
1. Go to SQL Editor in Supabase dashboard
2. Create a new query
3. Copy the entire content from `database/schema.sql`
4. Run the query to create all tables and policies

### Step 3: Environment Configuration

#### 3.1 Create Environment File
```bash
cp .env.example .env
```

#### 3.2 Update Environment Variables
Edit the `.env` file with your actual values:

```env
# Supabase Configuration (from Step 2.2)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# JWT Configuration (generate a strong secret)
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,video/mp4,application/pdf
```

#### 3.3 Generate JWT Secret
```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Face Detection Models Setup

#### 4.1 Create Models Directory
```bash
mkdir -p client/public/models
```

#### 4.2 Download Face-API Models
You need to download the following model files and place them in `client/public/models/`:

**Required Files:**
- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`
- `face_landmark_68_model-weights_manifest.json`
- `face_landmark_68_model-shard1`
- `face_recognition_model-weights_manifest.json`
- `face_recognition_model-shard1`
- `face_recognition_model-shard2`

**Download Options:**

1. **From face-api.js GitHub:**
   ```bash
   # Go to the models directory
   cd client/public/models
   
   # Download models (replace with actual URLs)
   curl -L -O https://github.com/justadudewhohacks/face-api.js/raw/master/weights/tiny_face_detector_model-weights_manifest.json
   curl -L -O https://github.com/justadudewhohacks/face-api.js/raw/master/weights/tiny_face_detector_model-shard1
   # ... (repeat for all model files)
   ```

2. **Manual Download:**
   - Visit https://github.com/justadudewhohacks/face-api.js/tree/master/weights
   - Download each required file
   - Place them in `client/public/models/`

### Step 5: Database Initialization

#### 5.1 Verify Database Setup
1. Go to Supabase dashboard → Table Editor
2. Verify these tables exist:
   - profiles
   - courses
   - modules
   - module_content
   - enrollments
   - user_progress
   - user_activity
   - uploads

#### 5.2 Create Test Admin User (Optional)
```sql
-- Run this in Supabase SQL Editor to create a test admin
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  'admin@example.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"full_name": "Admin User", "role": "admin"}'::jsonb
);
```

### Step 6: Application Startup

#### 6.1 Development Mode
```bash
# Start both client and server
npm run dev
```

#### 6.2 Separate Processes (Alternative)
```bash
# Terminal 1 - Start server
npm run server

# Terminal 2 - Start client
cd client
npm start
```

#### 6.3 Verify Setup
1. Open http://localhost:3000
2. Check browser console for errors
3. Try registering a new account
4. Test face detection setup
5. Verify admin features (if admin account created)

## 🔧 Common Setup Issues

### Issue 1: Face Detection Models Not Loading
**Symptoms:** Face detection doesn't work, console errors about missing models

**Solutions:**
1. Verify model files are in `client/public/models/`
2. Check file names match exactly
3. Ensure models are accessible at `http://localhost:3000/models/`

### Issue 2: Supabase Connection Errors
**Symptoms:** API calls fail, authentication errors

**Solutions:**
1. Verify Supabase URL and keys in `.env`
2. Check Supabase project is running
3. Verify database schema was applied correctly
4. Check RLS policies are enabled

### Issue 3: JWT Token Errors
**Symptoms:** Login works but subsequent requests fail

**Solutions:**
1. Ensure JWT_SECRET is set and consistent
2. Verify JWT_SECRET is at least 32 characters
3. Check token storage in browser localStorage

### Issue 4: File Upload Issues
**Symptoms:** File uploads fail or return errors

**Solutions:**
1. Verify `uploads/` directory exists and is writable
2. Check file size and type restrictions
3. Ensure multer middleware is properly configured

### Issue 5: Port Conflicts
**Symptoms:** Cannot start server or client

**Solutions:**
1. Change PORT in `.env` file
2. Kill processes using ports 3000 or 5000
3. Use different ports for development

## 🧪 Testing the Setup

### 1. Basic Functionality Test
- [ ] Homepage loads correctly
- [ ] Registration form works
- [ ] Login form works
- [ ] Navigation works after login
- [ ] Dashboard displays user information

### 2. Face Detection Test
- [ ] Camera permission requested
- [ ] Face detection overlay appears
- [ ] Face registration works
- [ ] Face login works
- [ ] Fallback to email/password works

### 3. Role-Based Access Test
- [ ] Student can access student routes
- [ ] Admin can access admin routes
- [ ] Unauthorized access is blocked
- [ ] Role badges display correctly

### 4. API Functionality Test
- [ ] Course listing works
- [ ] User profile updates
- [ ] File uploads work (admin)
- [ ] Progress tracking works

## 📱 Browser Compatibility

### Recommended Browsers
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

### Camera Requirements
- HTTPS in production (localhost works for development)
- Camera permission granted
- WebRTC support

## 🚀 Production Deployment

### Environment Setup
```env
NODE_ENV=production
CLIENT_URL=https://your-domain.com
```

### Build Process
```bash
# Build client
cd client
npm run build
cd ..

# Start production server
npm start
```

### Security Considerations
- Use HTTPS in production
- Secure JWT secret
- Enable Supabase RLS
- Configure CORS properly
- Set up rate limiting
- Use environment-specific secrets

## 📞 Getting Help

If you encounter issues:

1. **Check this guide** - Most common issues are covered
2. **Review error messages** - They often contain helpful information
3. **Check browser console** - For frontend issues
4. **Check server logs** - For backend issues
5. **Verify environment variables** - Common source of issues
6. **Test with demo credentials** - To isolate authentication issues

## 🎯 Next Steps

After successful setup:

1. **Customize branding** - Update logos, colors, and text
2. **Configure email** - Set up email notifications
3. **Add content** - Create courses and modules
4. **Test thoroughly** - Try all features
5. **Deploy to production** - When ready for live use

This setup guide should get you up and running with JL Learning Studio. The application includes comprehensive error handling and logging to help identify and resolve any issues that may arise.