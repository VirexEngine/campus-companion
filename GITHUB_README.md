# 🎓 Campus Companion

> An AI-powered educational management platform designed for modern campuses, combining intelligent student information management, academic tracking, and AI-assisted learning tools.

[![React](https://img.shields.io/badge/React-18.3-61dafb?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=flat-square&logo=flask)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-success?style=flat-square)

<div align="center">
  <img alt="Campus Companion Dashboard" src="https://via.placeholder.com/800x400?text=Campus+Companion+Dashboard" width="100%">
</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [User Roles & Permissions](#user-roles--permissions)
- [AI Features](#ai-features)
- [Database Schema](#database-schema)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

Campus Companion is a comprehensive digital hub designed specifically for educational institutions. It provides an integrated platform for students, teachers, and administrators to manage academic activities, track performance, collaborate seamlessly, and leverage AI-powered tools for enhanced learning experiences.

Whether you're a student tracking attendance and taking AI-generated quizzes, a teacher creating dynamic learning materials, or an administrator overseeing institutional operations—Campus Companion has you covered.

### 🌟 Highlights

- **🤖 AI-Powered**: Integrated Google Gemini API for chatbots and intelligent quiz generation
- **🔐 Biometric Security**: Face recognition-based authentication using advanced ML models
- **📱 Responsive Design**: Modern UI built with React, Tailwind CSS, and shadcn/ui components
- **👥 Multi-Role System**: Tailored experiences for students, teachers, and administrators
- **⚡ Real-Time**: Instant notifications, live dashboards, and reactive state management
- **📊 Analytics**: Comprehensive analytics and reporting for administrators
- **🔒 Enterprise Security**: JWT-based authentication, role-based access control, password hashing

---

## ✨ Key Features

### 🎓 For Students

| Feature | Description |
|---------|-------------|
| **Dashboard** | Personalized overview with key metrics and quick access |
| **Attendance Tracking** | Monitor real-time attendance records across subjects |
| **Timetable** | View class schedules and course assignments |
| **AI Quizzes** | Take AI-generated quizzes with scoring and achievement streaks |
| **Leaderboard** | Compete globally and track performance rankings |
| **Chatbot** | 24/7 AI assistant with campus knowledge and speech recognition |
| **Query/Helpdesk** | Submit questions to teachers/admins with reply tracking |
| **Document Vault** | Secure upload and management of academic documents |
| **Notifications** | Real-time alerts for attendance, announcements, and query replies |

### 👨‍🏫 For Teachers

| Feature | Description |
|---------|-------------|
| **Quiz Generation** | Create intelligent quizzes by uploading PDF materials—powered by Gemini AI |
| **Student Management** | View assigned students and monitor their performance |
| **Attendance** | Mark and track student attendance efficiently |
| **Query Response** | Respond to student queries and manage helpdesk tickets |
| **Analytics** | Track student progress and identify learning gaps |
| **Subject Management** | Configure and manage assigned subjects and courses |

### 🛠️ For Administrators

| Feature | Description |
|---------|-------------|
| **User Management** | Create, edit, and manage students, teachers, and admins |
| **Advanced Analytics** | Department-wise statistics, attendance trends, performance insights |
| **Bulk Operations** | Manage attendance, timetables, and subjects in bulk |
| **Notifications** | Broadcast system-wide announcements and alerts |
| **System Monitoring** | Query management, low attendance alerts, and system health |
| **Department Configuration** | Manage subjects, timetables, and department-specific settings |

### 🤖 AI & Intelligent Features

- **Intelligent Chatbot**: Campus-aware assistant using semantic search with knowledge base integration
- **AI Quiz Generation**: Automatic quiz creation from educational PDF materials
- **Facial Biometrics**: Secure login with face recognition technology
- **Smart Notifications**: Context-aware alerts and announcements
- **Predictive Analytics**: Identify at-risk students and learning patterns

---

## 💻 Technology Stack

### Frontend

| Layer | Technologies |
|-------|--------------|
| **Framework** | React 18.3 + TypeScript 5.8 |
| **Build Tool** | Vite 5.4 |
| **State Management** | Zustand 5.0 |
| **Data Fetching** | TanStack Query (React Query) 5.83 |
| **Styling** | Tailwind CSS 3.4 + Framer Motion 12.38 |
| **UI Components** | shadcn/ui (Radix UI) + Lucide Icons |
| **Routing** | React Router DOM 6.30 |
| **Forms** | React Hook Form 7.61 + Zod 3.25 |
| **AI/ML** | Google Generative AI SDK, Xenova Transformers, face-api.js |
| **Charts** | Recharts 2.15 |
| **Notifications** | Sonner 1.7 |
| **Testing** | Vitest 3.2, Playwright 1.57 |

### Backend

| Layer | Technologies |
|-------|--------------|
| **Framework** | Flask 3.0 |
| **Authentication** | Flask-JWT-Extended 4.6 |
| **Database** | SQLite 3 |
| **CORS** | Flask-CORS 4.0 |
| **Security** | Werkzeug 3.0 (password hashing) |
| **AI Integration** | Google Generative AI (Gemini) |
| **PDF Processing** | PyPDF2 |
| **ORM** | SQLite3 (raw SQL) |

### Infrastructure

- **Development Server**: Vite (port 8080)
- **API Server**: Flask (port 5001)
- **Database**: SQLite (embedded)
- **Deployment**: Docker-ready, supports cloud platforms

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0 or higher
- **Python** 3.8 or higher
- **npm** or **yarn** (for Node packages)
- **pip** (for Python packages)
- **Git**

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/campus-companion.git
cd campus-companion
```

#### 2. Backend Setup

```bash
# Create Python virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r backend/requirements.txt

# Create .env file for backend
cat > backend/.env << EOF
GEMINI_API_KEY=your_free_api_key_from_aistudio.google.com
GEMINI_LANDING_API_KEY=optional_alternate_key
JWT_SECRET_KEY=your-super-secret-key-change-in-production
EOF

# Initialize database (creates SQLite database and seed data)
python backend/seed.py

# Start Flask server
python backend/app.py
# Server runs on http://127.0.0.1:5001
```

#### 3. Frontend Setup

```bash
# Install Node dependencies
npm install

# Start development server
npm run dev
# Frontend runs on http://localhost:8080
# API requests auto-proxy to http://127.0.0.1:5001
```

#### 4. Access the Application

- **Frontend**: http://localhost:8080
- **Backend API**: http://127.0.0.1:5001
- **API Documentation**: Visit `/api` endpoints with Postman or similar tools

### Default Credentials (After Seeding)

```
Student Account:
- Email: student@campus.edu
- Password: student123
- Role: Student

Teacher Account:
- Email: teacher@campus.edu
- Password: teacher123
- Role: Teacher

Admin Account:
- Email: admin@campus.edu
- Password: admin123
- Role: Admin
```

> ⚠️ **Important**: Change these credentials in production!

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Campus Companion Platform                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                  ┌───────────┴───────────┐
                  │                       │
          ┌───────▼──────────┐    ┌───────▼──────────┐
          │  Frontend (SPA)   │    │  Backend (API)   │
          │  React + Vite     │    │  Flask + SQLite  │
          └───────┬──────────┘    └───────┬──────────┘
                  │ HTTP/REST            │
                  └───────────┬───────────┘
                              │
                    ┌─────────▼────────┐
                    │   SQLite DB      │
                    │  (database.db)   │
                    └──────────────────┘
                              │
                    ┌─────────▼────────────────┐
                    │  External Services      │
                    │  - Google Gemini API    │
                    │  - Web Speech API       │
                    │  - Face Recognition    │
                    └────────────────────────┘
```

### Data Flow

```
User Actions (UI) 
    ↓
React Components + Hooks
    ↓
Zustand State Store
    ↓
TanStack Query (API calls)
    ↓
Vite Dev Proxy (/api → :5001)
    ↓
Flask Routes + Authentication
    ↓
SQLite Database
    ↓
External APIs (Gemini, Face-API)
    ↓
Response → Component → UI Update
```

---

## 📁 Project Structure

```
campus-companion/
├── backend/
│   ├── app.py                    # Main Flask application (1500+ lines)
│   ├── requirements.txt          # Python dependencies
│   ├── schema.sql               # Database schema definition
│   ├── seed.py                  # Database initialization script
│   ├── database.db              # SQLite database (runtime generated)
│   ├── uploads/                 # User-uploaded documents
│   └── .env                     # Environment variables
│
├── src/
│   ├── components/              # Reusable React components
│   │   ├── ui/                  # shadcn/ui components (40+)
│   │   ├── layout/              # AppLayout, AppSidebar
│   │   ├── auth/                # ProtectedRoute, FaceCapture
│   │   ├── shared/              # Shared components
│   │   └── admin/               # Admin-specific components
│   │
│   ├── pages/                   # Page components (23 pages)
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── AttendancePage.tsx
│   │   ├── TimetablePage.tsx
│   │   ├── ChatbotPage.tsx
│   │   ├── QuizzesPage.tsx
│   │   ├── LeaderboardPage.tsx
│   │   ├── QueriesPage.tsx
│   │   ├── NotificationsPage.tsx
│   │   ├── DocumentVault.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── AdminPage.tsx
│   │   ├── admin/               # Admin sub-pages
│   │   └── dashboard/           # Dashboard variants
│   │
│   ├── store/                   # Zustand state management
│   │   ├── authStore.ts         # Authentication state
│   │   ├── appStore.ts          # Application state
│   │   └── settingsStore.ts     # User settings
│   │
│   ├── lib/                     # Utility libraries
│   │   ├── api.ts               # Centralized API client
│   │   ├── chatbotWorker.ts     # Web Worker for ML
│   │   └── utils.ts             # Helper functions
│   │
│   ├── hooks/                   # Custom React hooks
│   ├── test/                    # Test files
│   ├── App.tsx                  # Main app component + routing
│   ├── main.tsx                 # React entry point
│   └── index.css                # Global styles
│
├── public/
│   ├── models/                  # ML models (face-api.js)
│   └── index.html               # HTML template
│
├── Configuration Files
│   ├── vite.config.ts           # Vite build configuration
│   ├── tsconfig.json            # TypeScript configuration
│   ├── tailwind.config.ts       # Tailwind CSS configuration
│   ├── eslint.config.js         # ESLint rules
│   ├── vitest.config.ts         # Vitest configuration
│   ├── playwright.config.ts     # Playwright E2E tests
│   ├── postcss.config.js        # CSS processing
│   └── components.json          # shadcn/ui registry
│
├── package.json                 # NPM dependencies
├── tsconfig.json                # TypeScript configuration
├── README.md                    # Original project documentation
└── LICENSE                      # License file
```

---

## 🔌 API Documentation

### Base URL

```
http://127.0.0.1:5001/api
```

### Authentication Endpoints

```http
POST /login
POST /signup
POST /login/face
GET /profile
POST /logout
```

### Student Endpoints

```http
GET /student/dashboard
GET /attendance
GET /timetable
GET /quizzes
POST /quizzes/<id>/submit
GET /leaderboard
GET /queries
POST /queries
GET /notifications
POST /documents/upload
GET /documents
GET /tasks
POST /tasks
```

### Teacher Endpoints

```http
GET /teacher/dashboard
GET /teacher/students
POST /teacher/quizzes/generate
GET /queries
POST /queries/reply
POST /attendance
```

### Admin Endpoints

```http
GET /admin/dashboard
GET /admin/users
POST /admin/users
PUT /admin/users/<id>
DELETE /admin/users/<id>
GET /admin/analytics
POST /admin/attendance/bulk
GET /admin/queries
POST /admin/notifications/broadcast
POST /admin/subjects
```

### AI Endpoints

```http
POST /chat
POST /gn-chat
```

### Full API Documentation

Refer to `backend/app.py` for complete endpoint specifications, request/response formats, and error handling.

---

## 👥 User Roles & Permissions

### Student
- ✅ View personal dashboard
- ✅ Check attendance records
- ✅ View timetable
- ✅ Take quizzes and earn streaks
- ✅ View leaderboard rankings
- ✅ Submit queries to teachers/admins
- ✅ Upload and manage documents
- ✅ Chat with AI assistant
- ✅ View notifications
- ❌ Cannot manage other users
- ❌ Cannot access analytics
- ❌ Cannot generate quizzes

### Teacher
- ✅ View dashboard with student metrics
- ✅ See assigned students
- ✅ Generate AI quizzes from PDFs
- ✅ Mark attendance
- ✅ Respond to student queries
- ✅ Manage assigned subjects
- ✅ View student analytics
- ❌ Cannot delete users
- ❌ Cannot manage system settings
- ❌ Cannot broadcast notifications

### Admin
- ✅ Full system access
- ✅ Create/edit/delete users
- ✅ View comprehensive analytics
- ✅ Manage timetables and subjects
- ✅ Bulk attendance operations
- ✅ Broadcast system notifications
- ✅ Configure departments
- ✅ Monitor all queries
- ✅ Access all data
- ✅ System configuration

---

## 🤖 AI Features

### 1. Intelligent Chatbot

**How it works:**
- Reads campus knowledge base (`cleaned_knowledge.txt`)
- Uses Xenova transformers for browser-side embeddings
- Performs semantic search with cosine similarity
- Sends context + query to Google Gemini API
- Returns intelligent, context-aware responses

**Features:**
- Natural language understanding
- Speech recognition input (Web Speech API)
- Text-to-speech output
- Rate limiting (5 messages per 50 seconds)
- 20-minute cooldown on rate limit violations
- Web Worker processing to avoid UI blocking

**Usage:**
```typescript
POST /api/chat
Content-Type: application/json

{
  "message": "What are the office hours?"
}
```

### 2. AI Quiz Generation

**How it works:**
- Teacher uploads PDF file
- Backend extracts text (max 15 pages)
- Sends extracted content to Gemini API with structured prompt
- Returns 10 multiple-choice questions with answers
- Automatically saves questions to database
- Students can take the quiz immediately

**Features:**
- Automatic question generation
- Multiple-choice format
- Configurable timer per quiz
- Scoring and result tracking
- Streak counting for consecutive correct answers

**Usage:**
```bash
curl -X POST http://127.0.0.1:5001/api/teacher/quizzes/generate \
  -H "Authorization: Bearer JWT_TOKEN" \
  -F "file=@course_material.pdf" \
  -F "topic=Introduction to Python"
```

### 3. Facial Recognition Authentication

**How it works:**
- Uses face-api.js (TensorFlow.js-based)
- Loads pre-trained ML models from `public/models/`
- Detects user face from webcam video
- Generates 128-dimensional face descriptor
- Compares with stored face descriptor in database
- Issues JWT token on successful match

**Features:**
- Secure biometric login
- No password needed for returning users
- Fast face detection (<500ms)
- Fallback to password login

**Models Used:**
- `tinyFaceDetector`: Fast and accurate face detection
- `faceLandmark68Net`: Facial landmark detection
- `faceRecognitionNet`: Face descriptor generation

---

## 🗄️ Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  department TEXT,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('student', 'teacher', 'admin')),
  last_login DATETIME,
  face_descriptor TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Attendance Table
```sql
CREATE TABLE attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  subject TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT CHECK(status IN ('present', 'absent', 'late')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Timetable Table
```sql
CREATE TABLE timetable (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  subject TEXT NOT NULL,
  day TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  teacher TEXT,
  room TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Quizzes Table
```sql
CREATE TABLE quizzes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER,
  topic_name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  timer_seconds INTEGER DEFAULT 300,
  FOREIGN KEY (teacher_id) REFERENCES users(id)
);
```

#### Quiz Results Table
```sql
CREATE TABLE quiz_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  quiz_id INTEGER,
  score REAL,
  streak_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
);
```

#### Notifications Table
```sql
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  message TEXT NOT NULL,
  type TEXT CHECK(type IN ('info', 'warning', 'success', 'event', 'query')),
  date DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE,
  query_id INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Queries/Helpdesk Table
```sql
CREATE TABLE queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  message TEXT NOT NULL,
  reply TEXT,
  status TEXT CHECK(status IN ('open', 'in_progress', 'resolved')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  receiver_role TEXT,
  receiver_id INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Documents Table
```sql
CREATE TABLE user_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  filename TEXT NOT NULL,
  original_name TEXT,
  file_size INTEGER,
  upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Additional Tables**: `tasks`, `user_subjects`, `subjects`, `chat_history`, `quiz_questions`, etc.

---

## 🛠️ Development

### Available Commands

```bash
# Frontend
npm run dev              # Start Vite dev server (port 8080)
npm run build           # Production build
npm run build:dev       # Development build
npm run lint            # Run ESLint
npm run preview         # Preview production build
npm run test            # Run tests once
npm run test:watch      # Watch mode testing

# Backend
python backend/app.py           # Start Flask server
python backend/seed.py          # Initialize database
python backend/debug_db.py      # Database diagnostics
```

### Code Style & Standards

- **TypeScript**: Strict mode enabled, `tsconfig.json`
- **ESLint**: 9.32.0, configured with modern rules
- **Prettier**: Consistent formatting (via ESLint)
- **Component Naming**: PascalCase for components, camelCase for utilities
- **File Structure**: Co-locate related files, use index.ts for exports

### Testing

```bash
# Unit Tests (Vitest)
npm run test              # Run all tests
npm run test:watch       # Watch mode

# E2E Tests (Playwright)
npx playwright test       # Run E2E tests
npx playwright test --ui # Interactive mode
```

### Environment Variables

**Frontend** (uses Vite proxy, no env needed):
```
VITE_API_URL=http://127.0.0.1:5001  # Default via proxy
```

**Backend** (`backend/.env`):
```
GEMINI_API_KEY=your_free_api_key_from_aistudio.google.com
GEMINI_LANDING_API_KEY=optional_key
JWT_SECRET_KEY=your-super-secret-key
FLASK_ENV=development
```

### Getting Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com)
2. Click "Get API Key"
3. Create a new project or use existing
4. Copy the API key
5. Add to `backend/.env`

> ✅ Free tier includes 60 requests per minute

---

## 🚀 Deployment

### Prepare for Production

#### 1. Environment Setup

```bash
# Backend .env
GEMINI_API_KEY=prod_key
JWT_SECRET_KEY=very-long-random-secret-key-min-32-chars
FLASK_ENV=production
FLASK_DEBUG=False
```

#### 2. Frontend Build

```bash
npm run build
# Output: dist/ folder
```

#### 3. Backend Preparation

```bash
# Ensure requirements are pinned
pip freeze > backend/requirements.txt

# Initialize production database
python backend/seed.py

# Test server
python backend/app.py
```

### Docker Deployment

**Dockerfile Example:**
```dockerfile
FROM node:18 AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM python:3.11
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install -r requirements.txt
COPY backend/ ./backend
COPY --from=frontend-build /app/dist ./static
EXPOSE 5001
CMD ["python", "backend/app.py"]
```

### Cloud Platforms

**Heroku:**
```bash
heroku create campus-companion
git push heroku main
```

**AWS/GCP/Azure:**
- Deploy backend to Cloud Run, App Engine, or EC2
- Deploy frontend to S3 + CloudFront, Cloud Storage, or Static Web Apps
- Use managed SQLite or migrate to PostgreSQL

### Performance Optimization

- Enable gzip compression
- Use CDN for static assets
- Implement caching headers
- Database indexing on frequently queried columns
- Consider migrating from SQLite to PostgreSQL for production

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Follow project conventions

### Contribution Process

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/campus-companion.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow code style guidelines
   - Add tests for new features
   - Update documentation

4. **Commit with descriptive messages**
   ```bash
   git commit -m "feat: add amazing feature"
   ```

5. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Describe the changes
   - Link related issues
   - Ensure CI passes

### Commit Message Format

```
feat: add new feature
fix: resolve bug
docs: update documentation
style: format code
refactor: restructure code
test: add tests
chore: update dependencies
```

### Areas for Contribution

- 🎨 UI/UX improvements
- 🐛 Bug fixes
- 📚 Documentation
- 🧪 Tests and quality
- 🚀 Performance optimization
- 🌍 Internationalization (i18n)
- ♿ Accessibility improvements

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Campus Companion Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
...
```

---

## 🙋 Support & Community

### Getting Help

- 📖 **Documentation**: Check the [docs](./docs) folder
- 🐛 **Issues**: Report bugs on [GitHub Issues](https://github.com/yourusername/campus-companion/issues)
- 💬 **Discussions**: Join [GitHub Discussions](https://github.com/yourusername/campus-companion/discussions)
- 📧 **Email**: support@campuscompanion.dev

### Feature Requests

Have an idea? 
1. Check existing issues/discussions
2. Open a new GitHub Discussion
3. Describe the use case and expected behavior

### Security

Found a security vulnerability? Please email security@campuscompanion.dev instead of using the issue tracker.

---

## 🎉 Acknowledgments

- **Google Generative AI** - Powering our chatbot and quiz generation
- **Face API** - Enabling biometric authentication
- **React Community** - Excellent tools and libraries
- **shadcn/ui** - Beautiful, accessible components
- **Tailwind CSS** - Utility-first styling

---

## 📊 Project Stats

| Metric | Value |
|--------|-------|
| **Frontend Pages** | 23+ |
| **API Endpoints** | 50+ |
| **Database Tables** | 12+ |
| **Components** | 40+ |
| **Lines of Code** | 10,000+ |
| **Test Coverage** | In Progress |
| **Build Time** | <10s |

---

## 🔄 Roadmap

### v2.0 (Q2 2024)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Parent portal
- [ ] Video call integration for office hours
- [ ] More AI features (essay grading, plagiarism detection)

### v3.0 (Q3 2024)
- [ ] Multi-language support (i18n)
- [ ] Integration with LMS platforms (Canvas, Blackboard)
- [ ] Advanced scheduling with ML optimization
- [ ] Real-time collaboration tools

### Future Ideas
- 🎙️ Podcast/audio material support
- 🎥 Video streaming for lectures
- 🎮 Gamification enhancements
- 📱 Offline mode support
- 🌐 Multiple institution federation

---

<div align="center">

### Made with ❤️ for educators and students

[⬆ Back to top](#-campus-companion)

---

**Star us on GitHub** ⭐ if this project helps you!

</div>
