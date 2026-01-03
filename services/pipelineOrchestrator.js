/**
 * Pipeline Orchestrator Service
 * Coordinates the entire video-to-social content generation workflow
 */

import { extractTranscript, generateContent, cleanupTempFiles } from './geminiService.js';
import { parseContent } from './contentParser.js';
import { saveContent, getContentPreviews, checkVideoExists } from './fileManager.js';
import { logger } from '../utils/logger.js';
import { extractYouTubeId } from '../utils/validators.js';


/**
 * Fetch video title from noembed (no API key required)
 */
const fetchVideoTitle = async (videoUrl) => {
    try {
        if (!globalThis.fetch) return null; // Safety check
        const response = await fetch(`https://noembed.com/embed?url=${videoUrl}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.title || null;
    } catch (error) {
        // Silently fail for title fetch, it's optional
        return null;
    }
};

/**
 * Main pipeline orchestration function
 * Executes all phases of the video-to-social automation pipeline
 */
export const processPipeline = async (videoUrl, transcriptSource = 'gemini') => {
    const startTime = Date.now();
    const tempFiles = [];
    const timings = {};

    try {
        logger.info(`Starting pipeline for video: ${videoUrl}`);

        // Check if video already exists
        const videoId = extractYouTubeId(videoUrl);
        const existingVideo = await checkVideoExists(videoId);

        if (existingVideo) {
            logger.info(`Video ${videoId} already processed. Returning existing content.`);
            return {
                success: true,
                alreadyProcessed: true,
                message: 'Video already processed',
                data: existingVideo
            };
        }

        // Start fetching video title in parallel (don't await yet)
        const titlePromise = fetchVideoTitle(videoUrl);

        console.log('\n' + '='.repeat(80) + '\n');

        // ========================================================================
        // PHASE 1: TRANSCRIPT EXTRACTION (Parallel with title fetch)
        // ========================================================================
        const phase1Start = Date.now();
        const transcriptResult = await extractTranscript(videoUrl, transcriptSource);
        timings.phase1 = ((Date.now() - phase1Start) / 1000).toFixed(2);

        if (!transcriptResult.success) {
            return {
                success: false,
                phase: 'transcript_extraction',
                error: transcriptResult.error,
                details: 'Failed to extract transcript from video'
            };
        }

        tempFiles.push(transcriptResult.transcriptPath);
        logger.info(`⏱️  Phase 1 completed in ${timings.phase1}s`);

        // ========================================================================
        // PHASE 2: CONTENT GENERATION
        // ========================================================================
        const phase2Start = Date.now();
        const contentResult = await generateContent(transcriptResult.transcriptPath);
        timings.phase2 = ((Date.now() - phase2Start) / 1000).toFixed(2);

        if (!contentResult.success) {
            await cleanupTempFiles(tempFiles);
            return {
                success: false,
                phase: 'content_generation',
                error: contentResult.error,
                details: 'Failed to generate social media content'
            };
        }

        tempFiles.push(contentResult.outputPath);
        logger.info(`⏱️  Phase 2 completed in ${timings.phase2}s`);

        // ========================================================================
        // PHASE 3: CONTENT PARSING & STORAGE
        // ========================================================================
        const phase3Start = Date.now();
        logger.phase(3, 'Processing & Storage');

        // Await the title promise now (it's been running in parallel)
        const videoTitle = await titlePromise;
        if (videoTitle) {
            logger.info(`Video Title: ${videoTitle}`);
        }

        const parseResult = await parseContent(contentResult.content);

        if (!parseResult.success) {
            await cleanupTempFiles(tempFiles);
            return {
                success: false,
                phase: 'content_parsing',
                error: parseResult.error,
                details: 'Failed to parse generated content',
                rawContent: parseResult.rawContent
            };
        }

        // File system storage (part of Phase 3)
        const saveResult = await saveContent(videoUrl, parseResult.data, videoTitle, transcriptResult.transcript);

        if (!saveResult.success) {
            await cleanupTempFiles(tempFiles);
            return {
                success: false,
                phase: 'file_storage',
                error: saveResult.error,
                details: 'Failed to save content to file system'
            };
        }

        timings.phase3 = ((Date.now() - phase3Start) / 1000).toFixed(2);
        logger.info(`⏱️  Phase 3 completed in ${timings.phase3}s`);

        // ========================================================================
        // CLEANUP
        // ========================================================================
        await cleanupTempFiles(tempFiles);

        // ========================================================================
        // SUCCESS RESPONSE
        // ========================================================================
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        timings.total = duration;

        console.log('\n' + '='.repeat(80));
        logger.success(`Pipeline completed successfully in ${duration}s`);
        logger.info(`⏱️  Breakdown: Phase1=${timings.phase1}s | Phase2=${timings.phase2}s | Phase3=${timings.phase3}s`);
        console.log('='.repeat(80) + '\n');

        return {
            success: true,
            message: 'Content generated successfully',
            data: {
                videoUrl,
                timestamp: new Date().toISOString(),
                duration: `${duration}s`,
                timings,
                outputDirectory: saveResult.outputDirectory,
                files: saveResult.files,
                preview: getContentPreviews(parseResult.data),
                stats: {
                    transcriptLength: transcriptResult.transcript.length,
                    platforms: {
                        linkedin: {
                            chars: parseResult.data.linkedin.characterCount,
                            hashtags: parseResult.data.linkedin.hashtags.length
                        },
                        instagram: {
                            chars: parseResult.data.instagram.characterCount,
                            hashtags: parseResult.data.instagram.hashtags.length
                        },
                        twitter: {
                            chars: parseResult.data.twitter.characterCount,
                            hashtags: parseResult.data.twitter.hashtags.length
                        },
                        ghost: {
                            words: parseResult.data.ghost.wordCount
                        }
                    }
                }
            }
        };

    } catch (error) {
        // Unexpected error - cleanup and return
        await cleanupTempFiles(tempFiles);

        logger.error('Pipeline failed with unexpected error', error);

        return {
            success: false,
            phase: 'unknown',
            error: error.message,
            details: 'An unexpected error occurred during pipeline execution'
        };
    }
};
