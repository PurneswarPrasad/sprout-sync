import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
// import rateLimit from 'express-rate-limit';

import compression from 'compression';
import dotenv from 'dotenv';
import passport from './config/passport';
import { plantsRouter } from './routes/plants';
import { tasksRouter } from './routes/tasks';
import { healthRouter } from './routes/health';
import { testRouter } from './routes/test';
import { authRouter } from './routes/auth';
import { plantTasksRouter } from './routes/plantTasks';
import { plantNotesRouter } from './routes/plantNotes';
import { plantPhotosRouter } from './routes/plantPhotos';
import { aiRouter } from './routes/ai';
import plantTrackingRouter from './routes/plantTracking';
import uploadRouter from './routes/upload';
import googleCalendarRouter from './routes/googleCalendar';
import { plantGiftsRouter } from './routes/plantGifts';
import tutorialRouter from './routes/tutorial';
import { notificationsRouter } from './routes/notifications';
import { cronService } from './services/cronService';
import { usersRouter } from './routes/users';
import { publicRouter } from './routes/public';
import { gardensRouter } from './routes/gardens';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3001;

// Security middleware
app.use(helmet());

// Compression middleware
app.use(compression());

// CORS configuration
app.use(
  cors({
    origin: process.env['CORS_ORIGIN'] || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting
// const limiter = rateLimit({
//   windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
//   max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'), // limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.',
// });
// app.use(limiter);

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Initialize Passport (for OAuth only, no sessions)
app.use(passport.initialize());

// Routes
app.use('/api/health', healthRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/test', testRouter);
app.use('/auth', authRouter);
app.use('/api/ai', aiRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/google-calendar', googleCalendarRouter);
app.use('/api/tutorial', tutorialRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/users', usersRouter);
app.use('/api/public', publicRouter);
app.use('/api/gardens', gardensRouter);

// Plants routes (must come before nested routes)
app.use('/api/plants', plantsRouter);

// Plant gifts routes
app.use('/api/plant-gifts', plantGiftsRouter);

// Plant-specific nested routes (must come after main plants routes)
app.use('/api/plants/:plantId/tasks', plantTasksRouter);
app.use('/api/plants/:plantId/notes', plantNotesRouter);
app.use('/api/plants/:plantId/photos', plantPhotosRouter);
app.use('/api/plants/:plantId/tracking', plantTrackingRouter);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    message: '🌱 SproutSync API is running!',
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
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Global error handler:', err);
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env['NODE_ENV'] === 'development' ? err.message : 'Something went wrong',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌱 SproutSync API server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env['NODE_ENV'] || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  
  // Start cron jobs
  cronService.startDueTasksCheck();
});
