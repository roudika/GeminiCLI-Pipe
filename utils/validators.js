/**
 * Validators Utility
 * URL validation and input sanitization
 */

/**
 * Validates YouTube URL format
 * Supports: youtube.com/watch?v=, youtu.be/, youtube.com/embed/
 */
export const isValidYouTubeUrl = (url) => {
    if (!url || typeof url !== 'string') {
        return false;
    }

    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]{11}([\?&].*)?$/;
    return youtubeRegex.test(url);
};

/**
 * Extracts YouTube video ID from URL
 */
export const extractYouTubeId = (url) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
};

/**
 * Validates request body for /api/process-video endpoint
 */
export const validateProcessVideoRequest = (body) => {
    const errors = [];

    if (!body) {
        errors.push('Request body is required');
        return { valid: false, errors };
    }

    if (!body.videoUrl) {
        errors.push('videoUrl is required');
    } else if (!isValidYouTubeUrl(body.videoUrl)) {
        errors.push('Invalid YouTube URL format');
    }

    // Validate transcriptSource if provided
    if (body.transcriptSource) {
        const validSources = ['gemini', 'transcriptapi'];
        if (!validSources.includes(body.transcriptSource)) {
            errors.push(`Invalid transcriptSource. Must be one of: ${validSources.join(', ')}`);
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
};
