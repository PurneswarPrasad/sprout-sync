# 🌱 Plant Care App

A beautiful, plant-themed application for tracking and managing your plant care journey. Built with React, Node.js, TypeScript, and Prisma.

## Features

- **Google OAuth Authentication** - Secure sign-in with Google
- **Plant Management** - Add, track, and manage your plants
- **Care Scheduling** - Never miss watering, fertilizing, or pruning
- **AI Plant Identification** - Powered by Google Gemini Vision API
- **Smart Onboarding** - Camera capture or image URL upload
- **Beautiful UI** - Warm, plant-themed design with calming colors

## Tech Stack

### Backend
- Node.js + Express + TypeScript
- Prisma ORM with PostgreSQL
- Passport.js for Google OAuth
- Express Session for session management
- Zod for validation
- Helmet, CORS, Rate Limiting for security

### Frontend
- React + TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Axios for API calls
- Beautiful plant-themed UI

## Setup Instructions

### 1. Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- Google OAuth credentials

### 2. Backend Setup

```bash
cd backend
npm install
```

#### Environment Variables
Create a `.env` file in the `backend` directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/plant_care_db"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
OAUTH_CALLBACK_URL="http://localhost:3001/auth/google/callback"

# AI Services
GEMINI_API_KEY="your-gemini-api-key"

# Frontend URL
FRONTEND_URL="http://localhost:5173"

# Session
SESSION_SECRET="your-super-secret-session-key-change-in-production"

# CORS
CORS_ORIGIN="http://localhost:5173"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Server
PORT=3001
NODE_ENV=development
```

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Set Application Type to "Web application"
6. Add Authorized redirect URIs:
   - `http://localhost:3001/auth/google/callback`
7. Copy Client ID and Client Secret to your `.env` file

#### Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed the database
npm run db:seed
```

#### Start Backend
```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

#### Start Frontend
```bash
npm run dev
```

## Usage

1. **Landing Page** - Visit `http://localhost:5173` to see the beautiful landing page
2. **Sign In** - Click "Sign in with Google" to authenticate
3. **Homepage** - After authentication, you'll be redirected to the homepage
4. **Dashboard** - View your plant dashboard with stats and quick actions
5. **Logout** - Use the logout button to sign out

## API Endpoints

### Authentication
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - OAuth callback
- `GET /auth/profile` - Get user profile
- `POST /auth/logout` - Logout user
- `GET /auth/status` - Check authentication status

### Plants
- `GET /api/plants` - Get all plants
- `GET /api/plants/:id` - Get plant by ID
- `POST /api/plants` - Create new plant
- `PUT /api/plants/:id` - Update plant
- `DELETE /api/plants/:id` - Delete plant
- `GET /api/plants/task-templates` - Get available task templates
- `POST /api/plants/identify` - Identify plant from image

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/complete` - Mark task as completed
- `GET /api/tasks/upcoming` - Get upcoming tasks
- `GET /api/tasks/overdue` - Get overdue tasks

### Plant-Specific Tasks
- `GET /api/plants/:plantId/tasks` - Get all tasks for a specific plant
- `POST /api/plants/:plantId/tasks` - Create new task for a specific plant
- `GET /api/plants/:plantId/tasks/:taskId` - Get specific task for a plant
- `PUT /api/plants/:plantId/tasks/:taskId` - Update specific task for a plant
- `DELETE /api/plants/:plantId/tasks/:taskId` - Delete specific task for a plant
- `POST /api/plants/:plantId/tasks/:taskId/complete` - Mark task as completed
- `POST /api/plants/:plantId/tasks/:taskId/reschedule` - Reschedule task

### Plant Notes
- `GET /api/plants/:plantId/notes` - Get all notes for a specific plant
- `POST /api/plants/:plantId/notes` - Create new note for a specific plant

### Plant Photos
- `GET /api/plants/:plantId/photos` - Get all photos for a specific plant
- `POST /api/plants/:plantId/photos` - Create new photo for a specific plant

### Tags
- `GET /api/tags` - Get all tags for the authenticated user
- `POST /api/tags` - Create new tag
- `GET /api/tags/:id` - Get specific tag
- `PUT /api/tags/:id` - Update tag
- `DELETE /api/tags/:id` - Delete tag

### Plant Tag Management
- `GET /api/plants/:plantId/tags` - Get all tags assigned to a plant
- `POST /api/plants/:plantId/tags` - Assign a tag to a plant
- `DELETE /api/plants/:plantId/tags` - Unassign a tag from a plant
- `DELETE /api/plants/:plantId/tags/:tagId` - Unassign a specific tag from a plant

### AI Plant Identification
- `POST /api/ai/identify` - Identify plant from image (file upload or URL)
- `POST /api/ai/identify/file` - Identify plant from uploaded image file
- `POST /api/ai/identify/url` - Identify plant from image URL

## Design System

The app uses a warm, plant-themed color palette:
- **Primary**: Emerald greens (#10B981, #059669)
- **Secondary**: Sage greens (#6B7280, #4B5563)
- **Accent**: Warm yellows (#F59E0B, #D97706)
- **Background**: Soft gradients from emerald to amber

## Security Features

- **Session Management** - Secure HTTP-only cookies
- **CORS Protection** - Configured for frontend domain
- **Rate Limiting** - Prevents abuse
- **Input Validation** - Zod schemas for all endpoints
- **Authentication Middleware** - Protects private routes
- **RBAC (Role-Based Access Control)** - Users can only access their own plants and data
- **Plant Ownership Verification** - Middleware ensures users own plants before access

## AI Features

### Plant Identification
- **Gemini Vision API Integration** - Powered by Google's latest AI model
- **Multiple Input Methods** - Camera capture or image URL upload
- **Structured Response** - Returns plant species, care instructions, and suggested tasks
- **Confidence Scoring** - Shows identification accuracy to users
- **Smart Task Generation** - Automatically suggests care frequencies based on plant type
- **Fallback Handling** - Graceful degradation when AI identification fails

### AI Response Format
```json
{
  "speciesGuess": "Ficus lyrata",
  "plantType": "Indoor ornamental",
  "confidence": 0.92,
  "care": {
    "watering": "Water thoroughly every 3 days or when the topsoil is dry",
    "fertilizing": "Feed with balanced fertilizer every 14 days during growing season",
    "pruning": "Prune old or yellow leaves every 30 days",
    "spraying": "Mist or spray leaves every 7 days to maintain humidity",
    "sunlightRotation": "Rotate plant every 14 days to ensure even sunlight exposure"
  },
  "suggestedTasks": [
    { "name": "watering", "frequencyDays": 3 },
    { "name": "fertilizing", "frequencyDays": 14 },
    { "name": "pruning", "frequencyDays": 30 },
    { "name": "spraying", "frequencyDays": 7 },
    { "name": "sunlightRotation", "frequencyDays": 14 }
  ]
}
```

## API Features

- **Pagination** - All list endpoints support pagination with `page` and `limit` parameters
- **Filtering** - Plants can be filtered by search term, health status, and tags
- **Sorting** - Results are sorted by creation date (newest first) or relevance
- **Data Validation** - All input data is validated using Zod schemas
- **Error Handling** - Consistent error responses with appropriate HTTP status codes

## Development

### Backend Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript check
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```

### Frontend Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

---

Made with 🌱 for plant enthusiasts
