import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import dotenv from 'dotenv';
import passport from './config/passport';
import { plantsRouter } from './routes/plants';
import { tasksRouter } from './routes/tasks';
import { healthRouter } from './routes/health';
import { testRouter } from './routes/test';
import { authRouter } from './routes/auth';
import { tagsRouter } from './routes/tags';
import { plantTasksRouter } from './routes/plantTasks';
import { plantNotesRouter } from './routes/plantNotes';
import { plantPhotosRouter } from './routes/plantPhotos';
import { plantTagsRouter } from './routes/plantTags';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env['CORS_ORIGIN'] || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env['SESSION_SECRET'] || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env['NODE_ENV'] === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env['NODE_ENV'] === 'production' ? 'strict' : 'lax',
  },
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/health', healthRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/test', testRouter);
app.use('/auth', authRouter);

// Plants routes (must come before nested routes)
app.use('/api/plants', plantsRouter);

// Plant-specific nested routes (must come after main plants routes)
app.use('/api/plants/:plantId/tasks', plantTasksRouter);
app.use('/api/plants/:plantId/notes', plantNotesRouter);
app.use('/api/plants/:plantId/photos', plantPhotosRouter);
app.use('/api/plants/:plantId/tags', plantTagsRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🌱 Plant Care API is running!',
    version: '1.0.0',
    environment: process.env['NODE_ENV'] || 'development',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env['NODE_ENV'] === 'development' ? err.message : 'Something went wrong',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌱 Plant Care API server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env['NODE_ENV'] || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});
