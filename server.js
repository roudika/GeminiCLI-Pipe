/**
 * Video-to-Social Automation Pipeline API Server
 * KloudiHub - Gemini CLI Integration
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { authenticate } from './middleware/auth.js';
import { validateProcessVideoRequest } from './utils/validators.js';
import { logger } from './utils/logger.js';
import { processPipeline } from './services/pipelineOrchestrator.js';
import { getProcessingHistory, getVideoContent } from './services/fileManager.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// MIDDLEWARE
// ============================================================================

// CORS configuration for Vercel frontend
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['POST', 'GET'],
    credentials: true
}));

// Serve generated content statically (Protected by API Token)
app.use('/content', authenticate, express.static(path.join(process.cwd(), 'content')));

// JSON body parser
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    next();
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Video-to-Social Automation Pipeline',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

/**
 * Main endpoint: Process YouTube video
 * POST /api/process-video
 * Body: { videoUrl: string }
 * Headers: Authorization: Bearer <token>
 */
app.post('/api/process-video', authenticate, async (req, res) => {
    try {
        // Validate request body
        const validation = validateProcessVideoRequest(req.body);

        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request',
                details: validation.errors
            });
        }

        const { videoUrl, transcriptSource } = req.body;

        logger.info(`Processing video request: ${videoUrl}`);
        logger.info(`Transcript source: ${transcriptSource || 'gemini (default)'}`);

        // Execute pipeline
        const result = await processPipeline(videoUrl, transcriptSource);

        // Return appropriate response
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(500).json(result);
        }

    } catch (error) {
        logger.error('Unexpected error in /api/process-video', error);

        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
});

/**
 * History endpoint: Get list of all processed videos
 * GET /api/history
 */
app.get('/api/history', authenticate, async (req, res) => {
    try {
        const history = await getProcessingHistory();
        res.json({
            success: true,
            history
        });
    } catch (error) {
        logger.error('Error in /api/history', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve history'
        });
    }
});

/**
 * Content endpoint: Get all content for a specific video
 * GET /api/content/:videoId
 */
app.get('/api/content/:videoId', authenticate, async (req, res) => {
    try {
        const { videoId } = req.params;
        const result = await getVideoContent(videoId);

        if (result.success) {
            res.json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        logger.error('Error in /api/content/:videoId', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve content'
        });
    }
});

/**
 * 404 handler
 */
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Not found',
        details: `Route ${req.method} ${req.path} not found`
    });
});

/**
 * Global error handler
 */
app.use((err, req, res, next) => {
    logger.error('Global error handler', err);

    res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: err.message
    });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

app.listen(PORT, () => {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 Video-to-Social Automation Pipeline API Server');
    console.log('='.repeat(80));
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🔒 Authentication: Bearer token required`);
    console.log(`🌐 CORS: ${process.env.FRONTEND_URL || 'All origins'}`);
    console.log(`🤖 Gemini CLI: ${process.env.GEMINI_CLI_PATH || 'gemini'}`);
    console.log('='.repeat(80));
    console.log('\n📋 Available endpoints:');
    console.log(`  GET  /health              - Health check`);
    console.log(`  POST /api/process-video   - Process YouTube video`);
    console.log('\n' + '='.repeat(80) + '\n');

    logger.success('Server started successfully');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});
