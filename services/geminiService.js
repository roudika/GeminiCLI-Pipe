/**
 * Gemini CLI Service
 * Handles interaction with Gemini CLI for transcript extraction and content generation
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';
import { extractYouTubeId } from '../utils/validators.js';

const GEMINI_CLI = process.env.GEMINI_CLI_PATH || 'gemini';
const PHASE1_TIMEOUT = 600000; // 10 minutes for video processing
const PHASE2_TIMEOUT = 300000; // 5 minutes for content generation

/**
 * Execute Gemini CLI command with timeout and optional stdin
 */
const executeGeminiCommand = (args, stdinInput = null, timeoutMs = 180000) => {
    return new Promise((resolve, reject) => {
        logger.step(`Executing: ${GEMINI_CLI} ${args.join(' ')}`);

        const process = spawn(GEMINI_CLI, args, { shell: true });
        let stdout = '';
        let stderr = '';
        let timedOut = false;

        const timeout = setTimeout(() => {
            timedOut = true;
            process.kill();
            reject(new Error(`Gemini CLI timed out after ${timeoutMs / 1000} seconds`));
        }, timeoutMs);

        // Feed stdin if provided
        if (stdinInput) {
            process.stdin.write(stdinInput);
            process.stdin.end();
        }

        process.stdout.on('data', (data) => {
            const chunk = data.toString();
            stdout += chunk;
            // Log progress in real-time
            if (chunk.trim()) {
                // Remove ANSI escape codes for cleaner logs
                const cleanChunk = chunk.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-m]/g, '').trim();
                if (cleanChunk) logger.step(cleanChunk);
            }
        });

        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        process.on('close', (code) => {
            clearTimeout(timeout);

            if (timedOut) return;

            if (code === 0) {
                resolve({ stdout, stderr });
            } else {
                reject(new Error(`Gemini CLI exited with code ${code}\nStderr: ${stderr}`));
            }
        });

        process.on('error', (error) => {
            clearTimeout(timeout);
            reject(new Error(`Failed to start Gemini CLI: ${error.message}`));
        });
    });
};

/**
 * Phase 1: Extract transcript from YouTube video
 * Uses gemini-3-flash-preview with --output to save as VideoID.txt
 */
export const extractTranscript = async (videoUrl) => {
    logger.phase(1, 'Extracting transcript from YouTube video');
    logger.info(`Video URL: ${videoUrl}`);

    const tempDir = path.join(process.cwd(), 'temp');

    try {
        // Ensure temp directory exists
        await fs.mkdir(tempDir, { recursive: true });

        // Extract video ID
        const videoId = extractYouTubeId(videoUrl);
        if (!videoId) {
            throw new Error('Invalid YouTube URL - could not extract video ID');
        }

        const transcriptPath = path.join(tempDir, `${videoId}.txt`);

        // Optimized prompt - force use of integrated video tool
        const promptText = `Use the integrated video tool to watch this video. DO NOT use the Python interpreter, shell commands, or Google Search. Provide a full verbatim transcript in English based only on the video content. Video URL: ${videoUrl}`;
        const combinedPrompt = promptText;

        // Execute Gemini CLI - using gemini-2.5-flash-lite as requested
        const args = [
            '-m', 'gemini-2.5-flash-lite',
            '-y', // Auto-approve
            '--output-format', 'text',
            combinedPrompt
        ];

        const { stdout, stderr } = await executeGeminiCommand(args, null, PHASE1_TIMEOUT);

        // Gemini saves the file in the current directory, check both locations
        const currentDirPath = path.join(process.cwd(), `${videoId}.txt`);
        let transcript;

        // Check if Gemini created the file in current directory
        try {
            await fs.access(currentDirPath);
            // File exists in current directory, read and move it to temp
            transcript = await fs.readFile(currentDirPath, 'utf-8');
            await fs.writeFile(transcriptPath, transcript, 'utf-8');
            await fs.unlink(currentDirPath); // Remove from current directory
            logger.step(`Moved transcript from root to temp/${videoId}.txt`);
        } catch {
            // File not in current directory, check temp directory
            try {
                await fs.access(transcriptPath);
                transcript = await fs.readFile(transcriptPath, 'utf-8');
            } catch {
                // Gemini didn't create the file, use stdout instead
                transcript = stdout;
                await fs.writeFile(transcriptPath, transcript, 'utf-8');
                logger.step(`Saved transcript from stdout to temp/${videoId}.txt`);
            }
        }

        // VALIDATION: Check for valid transcript
        if (!transcript || transcript.trim().length < 100) {
            throw new Error(`Transcript too short or invalid (${transcript?.trim().length || 0} characters)`);
        }

        // Check for error messages or refusals
        const refusalPhrases = [
            "I cannot",
            "I am sorry",
            "Setup complete",
            "ready for your first command",
            "I can help with that"
        ];

        const isRefusal = refusalPhrases.some(phrase => transcript.includes(phrase)) && transcript.length < 500;

        if (isRefusal) {
            throw new Error(`Gemini refused to extract transcript. Response: "${transcript.substring(0, 150)}..."`);
        }

        logger.success(`Transcript extracted successfully (${transcript.trim().length} characters)`);
        logger.info(`Saved to: ${videoId}.txt`);

        // Cleanup: Remove VTT files that Gemini CLI creates in the project root
        try {
            const vttFiles = await fs.readdir(process.cwd());

            for (const file of vttFiles) {
                if (file.startsWith(videoId) && file.endsWith('.vtt')) {
                    await fs.unlink(path.join(process.cwd(), file));
                    logger.step(`Cleaned up VTT file: ${file}`);
                }
            }
        } catch (cleanupError) {
            // Non-critical error, just log it
            logger.warn('Failed to cleanup VTT files', cleanupError.message);
        }

        return {
            success: true,
            transcript: transcript.trim(),
            transcriptPath
        };

    } catch (error) {
        logger.error('Transcript extraction failed', error);

        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Phase 2: Generate social media content from transcript
 * Uses gemini-3-flash-preview with phase2-content-generation.toml
 */
export const generateContent = async (transcriptPath) => {
    logger.phase(2, 'Generating social media content for all platforms');

    const tempDir = path.join(process.cwd(), 'temp');
    const outputPath = path.join(tempDir, `social-content-${Date.now()}.md`);

    try {
        // Read transcript
        const transcript = await fs.readFile(transcriptPath, 'utf-8');

        // Load configuration and build full prompt
        const config = await fs.readFile('phase2-content-generation.toml', 'utf-8');
        const fullPrompt = `Generate the structured social media content kit based on the provided transcript. Strictly follow this configuration, branding rules, and output format:\n${config}\n\nTRANSCRIPT:\n${transcript}`;

        // Execute Gemini CLI with Phase 2 parameters
        // Note: Passing full prompt via stdin to avoid command line length limits
        const args = [
            '-m', 'gemini-3-flash-preview',
            '-y', // Auto-approve
            '--output-format', 'text'
        ];

        const { stdout, stderr } = await executeGeminiCommand(args, fullPrompt, PHASE2_TIMEOUT);

        // Check for empty output
        if (!stdout || stdout.trim().length === 0) {
            throw new Error('Gemini CLI returned empty content');
        }

        // Manually save output since CLI doesn't have --output
        await fs.writeFile(outputPath, stdout.trim(), 'utf-8');

        logger.success(`Content generated successfully (${stdout.length} characters)`);

        return {
            success: true,
            content: stdout,
            outputPath
        };

    } catch (error) {
        logger.error('Content generation failed', error);

        // Clean up temp file if it exists
        try {
            await fs.unlink(outputPath);
        } catch { }

        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Clean up temporary files
 */
export const cleanupTempFiles = async (filePaths) => {
    logger.step('Cleaning up temporary files');

    for (const filePath of filePaths) {
        try {
            await fs.unlink(filePath);
            logger.step(`Deleted: ${path.basename(filePath)}`);
        } catch (error) {
            logger.warn(`Failed to delete ${filePath}: ${error.message}`);
        }
    }
};
