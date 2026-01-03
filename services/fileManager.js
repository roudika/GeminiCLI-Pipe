/**
 * File Manager Service
 * Handles file system operations for saving generated content
 */

import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

/**
 * Get relative web path for a file
 */
const getWebPath = (basePath, filename) => {
    const absolutePath = filename ? path.join(basePath, filename) : basePath;
    const relative = path.relative(process.cwd(), absolutePath);
    return '/' + relative.replace(/\\/g, '/');
};

/**
 * Get unique path for video content
 */
const getVideoPath = (videoId, videoTitle) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    // Create safe slug from title (first 5 words)
    const safeTitle = (videoTitle || 'untitled')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .split(/\s+/)
        .slice(0, 5)
        .join('-');

    const folderName = `${videoId}-${safeTitle}`;

    return path.join(process.cwd(), 'content', `${year}-${month}-${day}`, folderName);
};

/**
 * Create directory structure for content
 */
const createDirectoryStructure = async (basePath) => {
    const directories = [
        basePath,
        path.join(basePath, 'ghost'),
        path.join(basePath, 'linkedin'),
        path.join(basePath, 'instagram'),
        path.join(basePath, 'twitter')
    ];

    for (const dir of directories) {
        await fs.mkdir(dir, { recursive: true });
    }

    logger.step(`Created directory structure: ${basePath}`);
};

/**
 * Save Ghost blog post in Ghost-compatible format
 */
const saveGhostPost = async (basePath, ghostData) => {
    const filePath = path.join(basePath, 'ghost', 'post.md');

    // Format frontmatter
    let content = '--- START FRONTMATTER ---\n\n';
    for (const [key, value] of Object.entries(ghostData.frontmatter)) {
        // Convert camelCase back to Title Case with spaces
        const displayKey = key.replace(/([A-Z])/g, ' $1').trim();
        const titleCaseKey = displayKey.charAt(0).toUpperCase() + displayKey.slice(1);
        content += `${titleCaseKey}: ${value}\n\n`;
    }
    content += '--- END FRONTMATTER ---\n\n';

    // Add body
    content += '--- START BODY ---\n\n';
    content += ghostData.body;
    content += '\n\n--- END BODY ---\n';

    await fs.writeFile(filePath, content, 'utf-8');
    logger.step(`Saved: ghost/post.md (${ghostData.wordCount} words)`);

    return getWebPath(basePath, 'ghost/post.md');
};

/**
 * Save social media post
 */
const saveSocialPost = async (basePath, platform, postData) => {
    const filePath = path.join(basePath, platform, 'post.txt');
    await fs.writeFile(filePath, postData.content, 'utf-8');

    logger.step(`Saved: ${platform}/post.txt (${postData.characterCount} chars, ${postData.hashtags.length} hashtags)`);

    return getWebPath(basePath, path.join(platform, 'post.txt'));
};

/**
 * Save image prompt
 */
const saveImagePrompt = async (basePath, imagePrompt) => {
    if (!imagePrompt) {
        logger.step('No image prompt to save');
        return null;
    }

    const filePath = path.join(basePath, 'image-prompt.txt');
    await fs.writeFile(filePath, imagePrompt, 'utf-8');

    logger.step('Saved: image-prompt.txt');

    return getWebPath(basePath, 'image-prompt.txt');
};

/**
 * Save metadata JSON
 */
const saveMetadata = async (basePath, videoUrl, parsedData) => {
    const metadata = {
        videoUrl,
        timestamp: new Date().toISOString(),
        generatedAt: new Date().toLocaleString(),
        platforms: {
            linkedin: {
                characterCount: parsedData.linkedin.characterCount,
                hashtagCount: parsedData.linkedin.hashtags.length,
                hashtags: parsedData.linkedin.hashtags
            },
            instagram: {
                characterCount: parsedData.instagram.characterCount,
                hashtagCount: parsedData.instagram.hashtags.length,
                hashtags: parsedData.instagram.hashtags
            },
            twitter: {
                characterCount: parsedData.twitter.characterCount,
                hashtagCount: parsedData.twitter.hashtags.length,
                hashtags: parsedData.twitter.hashtags
            },
            ghost: {
                wordCount: parsedData.ghost.wordCount,
                title: parsedData.ghost.frontmatter.Title || parsedData.ghost.frontmatter.title,
                metaTitle: parsedData.ghost.frontmatter.MetaTitle || parsedData.ghost.frontmatter.metaTitle
            }
        },
        hasImagePrompt: !!parsedData.imagePrompt
    };

    const filePath = path.join(basePath, 'metadata.json');
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2), 'utf-8');

    logger.step('Saved: metadata.json');

    return getWebPath(basePath, 'metadata.json');
};

/**
 * Save full transcript
 */
const saveTranscript = async (basePath, transcript) => {
    if (!transcript) return null;
    const filePath = path.join(basePath, 'transcript.txt');
    await fs.writeFile(filePath, transcript, 'utf-8');
    logger.step(`Saved: transcript.txt (${transcript.length} chars)`);
    return getWebPath(basePath, 'transcript.txt');
};

import { extractYouTubeId } from '../utils/validators.js';

/**
 * Main function to save all content
 */
export const saveContent = async (videoUrl, parsedData, videoTitle, transcript) => {
    logger.info('Saving content to file system');

    try {
        const videoId = extractYouTubeId(videoUrl) || `video-${Date.now()}`;
        const basePath = getVideoPath(videoId, videoTitle);

        // Create directory structure
        await createDirectoryStructure(basePath);

        // Save all content
        const savedFiles = {
            transcript: await saveTranscript(basePath, transcript),
            ghost: await saveGhostPost(basePath, parsedData.ghost),
            linkedin: await saveSocialPost(basePath, 'linkedin', parsedData.linkedin),
            instagram: await saveSocialPost(basePath, 'instagram', parsedData.instagram),
            twitter: await saveSocialPost(basePath, 'twitter', parsedData.twitter),
            imagePrompt: await saveImagePrompt(basePath, parsedData.imagePrompt),
            metadata: await saveMetadata(basePath, videoUrl, parsedData)
        };
        logger.success(`All content saved to: ${basePath}`);

        return {
            success: true,
            outputDirectory: basePath,
            files: savedFiles
        };

    } catch (error) {
        logger.error('Failed to save content', error);

        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Get preview of content for API response
 */
export const getContentPreviews = (parsedData) => {
    const preview = (text, length = 100) => {
        return text.length > length ? text.substring(0, length) + '...' : text;
    };

    return {
        ghostTitle: parsedData.ghost.frontmatter.Title || parsedData.ghost.frontmatter.title || 'Untitled',
        linkedinPreview: preview(parsedData.linkedin.content),
        instagramPreview: preview(parsedData.instagram.content),
        twitterPreview: preview(parsedData.twitter.content)
    };
};
/**
 * Check if a video has already been processed
 */
export const checkVideoExists = async (videoId) => {
    if (!videoId) return null;

    const contentPath = path.join(process.cwd(), 'content');

    try {
        await fs.access(contentPath);
        const dates = await fs.readdir(contentPath);

        for (const date of dates) {
            if (date === '.gitignore') continue;

            const datePath = path.join(contentPath, date);
            const stat = await fs.stat(datePath);

            if (stat.isDirectory()) {
                const videos = await fs.readdir(datePath);

                for (const videoDir of videos) {
                    if (videoDir.startsWith(videoId + '-')) {
                        const videoPath = path.join(datePath, videoDir);
                        const metadataPath = path.join(videoPath, 'metadata.json');

                        try {
                            const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
                            return {
                                path: `/content/${date}/${videoDir}`,
                                processedAt: metadata.timestamp,
                                ...metadata
                            };
                        } catch {
                            return {
                                path: `/content/${date}/${videoDir}`,
                                processedAt: stat.birthtime
                            };
                        }
                    }
                }
            }
        }

        return null;
    } catch {
        return null;
    }
};

/**
 * Get processing history (all dates and videos)
 */
export const getProcessingHistory = async () => {
    const contentPath = path.join(process.cwd(), 'content');
    const history = [];

    try {
        // Check if content directory exists
        try { await fs.access(contentPath); } catch { return []; }

        const dates = await fs.readdir(contentPath);

        for (const date of dates) {
            if (date === '.gitignore') continue;

            const datePath = path.join(contentPath, date);
            const stat = await fs.stat(datePath);

            if (stat.isDirectory()) {
                const videos = await fs.readdir(datePath);
                const videoEntries = [];

                for (const videoDir of videos) {
                    const videoPath = path.join(datePath, videoDir);
                    const vStat = await fs.stat(videoPath);

                    if (vStat.isDirectory()) {
                        videoEntries.push({
                            id: videoDir.split('-')[0],
                            folderName: videoDir,
                            path: `/content/${date}/${videoDir}`,
                            processedAt: vStat.birthtime
                        });
                    }
                }

                history.push({
                    date,
                    videos: videoEntries.sort((a, b) => b.processedAt - a.processedAt)
                });
            }
        }

        return history.sort((a, b) => b.date.localeCompare(a.date));
    } catch (error) {
        logger.error('Failed to get history', error);
        return [];
    }
};

/**
 * Get content for a specific video by ID
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<{success: boolean, content?: object, error?: string}>}
 */
export const getVideoContent = async (videoId) => {
    try {
        const contentDir = path.join(process.cwd(), 'content');

        // Search through date folders to find the video
        const dates = await fs.readdir(contentDir);

        for (const date of dates) {
            const datePath = path.join(contentDir, date);
            const stat = await fs.stat(datePath);

            if (stat.isDirectory()) {
                const folders = await fs.readdir(datePath);

                // Find folder that starts with the video ID
                const videoFolder = folders.find(f => f.startsWith(videoId));

                if (videoFolder) {
                    const videoPath = path.join(datePath, videoFolder);

                    // Read all platform content
                    const [linkedin, instagram, twitter, ghost, transcript] = await Promise.all([
                        fs.readFile(path.join(videoPath, 'linkedin', 'post.txt'), 'utf-8').catch(() => null),
                        fs.readFile(path.join(videoPath, 'instagram', 'post.txt'), 'utf-8').catch(() => null),
                        fs.readFile(path.join(videoPath, 'twitter', 'post.txt'), 'utf-8').catch(() => null),
                        fs.readFile(path.join(videoPath, 'ghost', 'post.md'), 'utf-8').catch(() => null),
                        fs.readFile(path.join(videoPath, 'transcript.txt'), 'utf-8').catch(() => null)
                    ]);

                    return {
                        success: true,
                        content: {
                            videoId,
                            folderName: videoFolder,
                            date,
                            linkedin,
                            instagram,
                            twitter,
                            ghost,
                            transcript
                        }
                    };
                }
            }
        }

        return {
            success: false,
            error: `Video ${videoId} not found`
        };

    } catch (error) {
        logger.error('Failed to get video content', error);
        return {
            success: false,
            error: error.message
        };
    }
};

