# 🌱 Plant Care App

A beautiful, plant-themed application for tracking and managing your plant care journey. Built with React, Node.js, TypeScript, and Prisma.

## Features

- **Google OAuth Authentication** - Secure sign-in with Google
- **Plant Management** - Add, track, and manage your plants
- **Care Scheduling** - Never miss watering, fertilizing, or pruning
- **AI Plant Identification** - Powered by Google Gemini Vision API
- **AI Health Monitoring** - Analyze plant health issues and get care recommendations
- **Plant Tracking System** - Track plant updates with photos and detailed notes
- **Real-time Camera Capture** - Take photos directly in the app or upload from device
- **Smart Onboarding** - Camera capture or image URL upload
- **City Autocomplete** - Smart city search with OpenStreetMap integration
- **Image Management** - Cloudinary integration for secure image storage and optimization
- **Beautiful UI** - Warm, plant-themed design with calming colors

## Tech Stack

### Backend
- Node.js + Express + TypeScript
- Prisma ORM with PostgreSQL
- Passport.js for Google OAuth
- Express Session for session management
- Zod for validation
- Helmet, CORS, Rate Limiting for security
- Cloudinary for image storage and optimization
- Google Gemini AI for plant identification and health analysis

### Frontend
- React + TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Axios for API calls
- Cloudinary React for image handling
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

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"

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

#### Cloudinary Setup
1. Go to [Cloudinary](https://cloudinary.com/) and create a free account
2. Go to your Dashboard to find your credentials
3. Copy the following values to your `.env` file:
   - Cloud Name
   - API Key
   - API Secret
4. These will be used for secure image storage and optimization

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
5. **Plant Management** - Add, edit, and manage your plants
6. **Plant Tracking** - Track plant updates with photos and notes
7. **Health Monitoring** - Use AI to analyze plant health issues
8. **Care Scheduling** - Set up and manage plant care tasks
9. **Logout** - Use the logout button to sign out

### Plant Tracking Workflow
1. **Navigate to Plant** - Go to any plant's detail page
2. **Health Tab** - Click on the "Health" tab
3. **Track Updates** - Click "+" to add tracking updates or monitor health
4. **Upload Photos** - Take photos with camera or upload from device
5. **Add Notes** - Include observations and care notes
6. **AI Analysis** - Get instant health analysis for uploaded photos
7. **Save Updates** - Submit updates to track plant progress

### Health Monitoring Workflow
1. **Monitor Health** - Click "Monitor plant health" from the health tab
2. **Upload Photo** - Take a photo or upload from device
3. **AI Analysis** - Get instant health assessment and recommendations
4. **Review Results** - Check AI diagnosis and edit if needed
5. **Save Analysis** - Submit health analysis as a tracking update

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

### Plant Tracking
- `GET /api/plants/:plantId/tracking` - Get all tracking updates for a specific plant
- `POST /api/plants/:plantId/tracking` - Create new tracking update for a specific plant
- `DELETE /api/plants/:plantId/tracking/:trackingId` - Delete a specific tracking update

### Image Upload
- `POST /api/upload/image` - Upload image to Cloudinary
- `DELETE /api/upload/image/*` - Delete image from Cloudinary

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
- `POST /api/ai/identify/file` - Identify plant from uploaded image file
- `POST /api/ai/identify/url` - Identify plant from image URL

### AI Health Analysis
- `POST /api/ai/identify/issue/url` - Analyze plant health issues from image URL

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

### Plant Health Monitoring
- **AI-Powered Disease Detection** - Analyze plant photos for health issues
- **Comprehensive Health Reports** - Get detailed analysis including:
  - Issue identification (disease, pest damage, nutrient deficiency)
  - Affected plant types
  - Step-by-step care recommendations
  - Confidence scoring for diagnosis
- **Real-time Analysis** - Instant health assessment from uploaded photos
- **Smart Recommendations** - Actionable care steps based on detected issues

### AI Response Formats

#### Plant Identification Response
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

#### Plant Health Analysis Response
```json
{
  "speciesGuess": "Monstera deliciosa",
  "confidence": 0.85,
  "disease": {
    "issue": "Chewing Insect Damage",
    "description": "Leaves show multiple irregular holes and chewed margins, typically caused by feeding insects like caterpillars, slugs, or beetles.",
    "affected": "A wide range of plants, including many ornamental shrubs, garden plants, and trees.",
    "steps": "Inspect plants regularly for pests. Hand-remove visible pests. Apply insecticidal soap or neem oil for minor infestations.",
    "issueConfidence": 0.78
  }
}
```

## City Autocomplete Features

### Smart City Search
- **OpenStreetMap Integration** - Uses Nominatim API for accurate city data
- **Debounced Search** - 300ms delay to prevent excessive API calls
- **Keyboard Navigation** - Arrow keys, Enter, and Escape support
- **Auto-complete Suggestions** - Real-time city suggestions as you type
- **Fallback Support** - Mock data for development and API failures

### Features
- **City + Country Storage** - Stores clean "City, Country" format in database
- **Full Display Names** - Shows "City, State, Country" in dropdown for clarity
- **Loading States** - Visual feedback during API calls
- **Error Handling** - Graceful fallback when API is unavailable
- **Clear Functionality** - Easy way to clear selected city

### Usage
- Type at least 2 characters to trigger search
- Use arrow keys to navigate suggestions
- Press Enter to select highlighted city
- Press Escape to close dropdown
- Click outside to close dropdown

## Plant Tracking & Health Monitoring Features

### Plant Tracking System
- **Photo Updates** - Upload photos to track plant growth and changes
- **Detailed Notes** - Add observations, concerns, and care notes
- **Date Tracking** - Automatic date stamping with editable format
- **Visual Timeline** - View all tracking updates in a clean grid layout
- **Update Management** - View, edit, and delete tracking updates
- **Responsive Design** - Works seamlessly on desktop and mobile

### Health Monitoring
- **AI-Powered Analysis** - Upload photos for instant health assessment
- **Disease Detection** - Identify common plant diseases and pest damage
- **Care Recommendations** - Get specific steps to address health issues
- **Confidence Scoring** - See how confident the AI is in its diagnosis
- **Editable Results** - Modify AI-generated analysis before saving
- **Health History** - Track health issues and treatments over time

### Image Management
- **Cloudinary Integration** - Secure, optimized image storage
- **Real-time Camera Capture** - Take photos directly in the app
- **Device Upload** - Upload existing photos from your device
- **Image Optimization** - Automatic compression and format optimization
- **Smart Cleanup** - Automatic deletion of unused images
- **Preview & Delete** - Easy image management with red cross delete buttons

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
