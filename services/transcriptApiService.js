/**
 * TranscriptAPI.com Service
 * Fast transcript extraction using TranscriptAPI.com
 */

import { logger } from '../utils/logger.js';
import { extractYouTubeId } from '../utils/validators.js';

const TRANSCRIPT_API_URL = 'https://transcriptapi.com/api/v2/youtube/transcript';

/**
 * Fetch transcript from TranscriptAPI.com
 * @param {string} videoUrl - YouTube video URL
 * @returns {Promise<{success: boolean, transcript?: string, error?: string}>}
 */
export const fetchTranscriptFromAPI = async (videoUrl) => {
    logger.info('Fetching transcript from TranscriptAPI.com...');

    const apiKey = process.env.TRANSCRIPT_API_KEY;

    try {
        // Validate API key
        if (!apiKey) {
            throw new Error('TRANSCRIPT_API_KEY not found in environment variables');
        }

        // Extract video ID
        const videoId = extractYouTubeId(videoUrl);
        if (!videoId) {
            throw new Error('Invalid YouTube URL - could not extract video ID');
        }

        logger.info(`Video ID: ${videoId}`);

        // Build API request
        const apiUrl = `${TRANSCRIPT_API_URL}?video_url=${videoId}&format=json`;

        const startTime = Date.now();
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const endTime = Date.now();
        logger.info(`TranscriptAPI responded in ${((endTime - startTime) / 1000).toFixed(2)}s`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`TranscriptAPI error (${response.status}): ${errorText}`);
        }

        const data = await response.json();

        // Debug: Log the response structure
        logger.info(`TranscriptAPI response type: ${typeof data}`);
        logger.info(`Is array: ${Array.isArray(data)}`);

        // Parse transcript from response
        // TranscriptAPI may return different formats:
        // 1. Array of segments: [{ text: "..." }, ...]
        // 2. Object with transcript property: { transcript: [...] }
        // 3. Object with text property: { text: "..." }

        let transcript = '';

        if (Array.isArray(data)) {
            // Format 1: Array of segments
            transcript = data
                .map(segment => segment.text || '')
                .join(' ')
                .trim();
        } else if (data && typeof data === 'object') {
            // Format 2: Object with transcript array
            if (Array.isArray(data.transcript)) {
                transcript = data.transcript
                    .map(segment => segment.text || '')
                    .join(' ')
                    .trim();
            }
            // Format 3: Object with text property
            else if (data.text) {
                transcript = data.text.trim();
            }
            // Format 4: Object with data property containing array
            else if (Array.isArray(data.data)) {
                transcript = data.data
                    .map(segment => segment.text || '')
                    .join(' ')
                    .trim();
            }
        }

        if (!transcript) {
            logger.error('Could not parse transcript from response:', JSON.stringify(data).substring(0, 200));
            throw new Error('Invalid response format from TranscriptAPI - no transcript found');
        }

        if (!transcript || transcript.length < 100) {
            throw new Error(`Transcript too short or invalid (${transcript.length} characters)`);
        }

        logger.success(`Transcript fetched successfully (${transcript.length} characters)`);

        return {
            success: true,
            transcript
        };

    } catch (error) {
        logger.error('TranscriptAPI fetch failed', error);
        return {
            success: false,
            error: error.message
        };
    }
};
