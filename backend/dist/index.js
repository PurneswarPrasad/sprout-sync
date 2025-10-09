"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const passport_1 = __importDefault(require("./config/passport"));
const plants_1 = require("./routes/plants");
const tasks_1 = require("./routes/tasks");
const health_1 = require("./routes/health");
const test_1 = require("./routes/test");
const auth_1 = require("./routes/auth");
const plantTasks_1 = require("./routes/plantTasks");
const plantNotes_1 = require("./routes/plantNotes");
const plantPhotos_1 = require("./routes/plantPhotos");
const ai_1 = require("./routes/ai");
const plantTracking_1 = __importDefault(require("./routes/plantTracking"));
const upload_1 = __importDefault(require("./routes/upload"));
const googleCalendar_1 = __importDefault(require("./routes/googleCalendar"));
const plantGifts_1 = require("./routes/plantGifts");
const userSettings_1 = require("./routes/userSettings");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env['PORT'] || 3001;
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, cors_1.default)({
    origin: process.env['CORS_ORIGIN'] || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use(passport_1.default.initialize());
app.use('/api/health', health_1.healthRouter);
app.use('/api/tasks', tasks_1.tasksRouter);
app.use('/api/test', test_1.testRouter);
app.use('/auth', auth_1.authRouter);
app.use('/api/ai', ai_1.aiRouter);
app.use('/api/upload', upload_1.default);
app.use('/api/google-calendar', googleCalendar_1.default);
app.use('/api/user-settings', userSettings_1.userSettingsRouter);
app.use('/api/plants', plants_1.plantsRouter);
app.use('/api/plant-gifts', plantGifts_1.plantGiftsRouter);
app.use('/api/plants/:plantId/tasks', plantTasks_1.plantTasksRouter);
app.use('/api/plants/:plantId/notes', plantNotes_1.plantNotesRouter);
app.use('/api/plants/:plantId/photos', plantPhotos_1.plantPhotosRouter);
app.use('/api/plants/:plantId/tracking', plantTracking_1.default);
app.get('/', (_req, res) => {
    res.json({
        message: '🌱 SproutSync API is running!',
        version: '1.0.0',
        environment: process.env['NODE_ENV'] || 'development',
        timestamp: new Date().toISOString(),
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
    });
});
app.use((err, _req, res, _next) => {
    console.error('Global error handler:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env['NODE_ENV'] === 'development' ? err.message : 'Something went wrong',
    });
});
app.listen(PORT, () => {
    console.log(`🌱 SproutSync API server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env['NODE_ENV'] || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});
//# sourceMappingURL=index.js.map