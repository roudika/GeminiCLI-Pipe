/**
 * Content Parser Service
 * Parses structured markdown output from Gemini Phase 2 into platform-specific content
 */

import { logger } from '../utils/logger.js';

/**
 * Extract section content between headers
 */
const extractSection = (content, headerRegex, nextHeaderRegex = null) => {
    const headerMatch = content.match(headerRegex);
    if (!headerMatch) return null;

    const startIndex = headerMatch.index + headerMatch[0].length;
    let endIndex = content.length;

    if (nextHeaderRegex) {
        const nextMatch = content.slice(startIndex).match(nextHeaderRegex);
        if (nextMatch) {
            endIndex = startIndex + nextMatch.index;
        }
    }

    return content.slice(startIndex, endIndex).trim();
};

/**
 * Remove separator lines (---) from content
 */
const removeSeparators = (content) => {
    return content.replace(/^---+$/gm, '').trim();
};

/**
 * Extract hashtags from post content
 */
const extractHashtags = (content) => {
    const hashtagRegex = /#[\w]+/g;
    const matches = content.match(hashtagRegex);
    return matches || [];
};

/**
 * Parse LinkedIn post
 */
const parseLinkedIn = (content) => {
    logger.step('Parsing LinkedIn post');

    const section = extractSection(
        content,
        /###\s*1\.\s*LinkedIn Post/i,
        /###\s*2\.\s*Instagram Post/i
    );

    if (!section) {
        throw new Error('LinkedIn post section not found');
    }

    const cleanContent = removeSeparators(section);
    const hashtags = extractHashtags(cleanContent);

    return {
        content: cleanContent,
        hashtags,
        characterCount: cleanContent.length
    };
};

/**
 * Parse Instagram post
 */
const parseInstagram = (content) => {
    logger.step('Parsing Instagram post');

    const section = extractSection(
        content,
        /###\s*2\.\s*Instagram Post/i,
        /###\s*3\.\s*Twitter Post/i
    );

    if (!section) {
        throw new Error('Instagram post section not found');
    }

    const cleanContent = removeSeparators(section);
    const hashtags = extractHashtags(cleanContent);

    return {
        content: cleanContent,
        hashtags,
        characterCount: cleanContent.length
    };
};

/**
 * Parse Twitter post
 */
const parseTwitter = (content) => {
    logger.step('Parsing Twitter post');

    const section = extractSection(
        content,
        /###\s*3\.\s*Twitter Post/i,
        /###\s*4\.\s*Ghost Blog Post/i
    );

    if (!section) {
        throw new Error('Twitter post section not found');
    }

    const cleanContent = removeSeparators(section);
    const hashtags = extractHashtags(cleanContent);

    return {
        content: cleanContent,
        hashtags,
        characterCount: cleanContent.length
    };
};

/**
 * Parse Ghost blog post (frontmatter + body)
 */
const parseGhost = (content) => {
    logger.step('Parsing Ghost blog post');

    const section = extractSection(
        content,
        /###\s*4\.\s*Ghost Blog Post/i,
        /###\s*5\.\s*Image Generation Prompt/i
    );

    if (!section) {
        throw new Error('Ghost blog post section not found');
    }

    // Extract frontmatter
    const frontmatterMatch = section.match(/---\s*START FRONTMATTER\s*---\s*([\s\S]*?)\s*---\s*END FRONTMATTER\s*---/i);
    if (!frontmatterMatch) {
        throw new Error('Ghost frontmatter not found');
    }

    const frontmatterText = frontmatterMatch[1].trim();
    const frontmatter = {};

    // Parse frontmatter Key: Value pairs
    const lines = frontmatterText.split('\n');
    for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.slice(0, colonIndex).trim();
            const value = line.slice(colonIndex + 1).trim();

            // Convert key to camelCase for JavaScript object
            const camelKey = key.replace(/\s+(\w)/g, (_, letter) => letter.toUpperCase()).replace(/\s+/g, '');
            frontmatter[camelKey] = value;
        }
    }

    // Extract body
    const bodyMatch = section.match(/---\s*START BODY\s*---\s*([\s\S]*?)\s*---\s*END BODY\s*---/i);
    if (!bodyMatch) {
        throw new Error('Ghost body not found');
    }

    const body = bodyMatch[1].trim();

    return {
        frontmatter,
        body,
        wordCount: body.split(/\s+/).length
    };
};

/**
 * Parse image generation prompt
 */
const parseImagePrompt = (content) => {
    logger.step('Parsing image generation prompt');

    const section = extractSection(
        content,
        /###\s*5\.\s*Image Generation Prompt/i
    );

    if (!section) {
        logger.warn('Image generation prompt section not found');
        return null;
    }

    return removeSeparators(section);
};

/**
 * Main parser function - parses all sections from Gemini output
 */
export const parseContent = async (content) => {
    logger.info('Parsing generated content');

    try {
        const parsed = {
            linkedin: parseLinkedIn(content),
            instagram: parseInstagram(content),
            twitter: parseTwitter(content),
            ghost: parseGhost(content),
            imagePrompt: parseImagePrompt(content)
        };

        logger.success('Content parsed successfully');
        logger.info('Parsed content summary:', {
            linkedin: `${parsed.linkedin.characterCount} chars, ${parsed.linkedin.hashtags.length} hashtags`,
            instagram: `${parsed.instagram.characterCount} chars, ${parsed.instagram.hashtags.length} hashtags`,
            twitter: `${parsed.twitter.characterCount} chars, ${parsed.twitter.hashtags.length} hashtags`,
            ghost: `${parsed.ghost.wordCount} words`,
            imagePrompt: parsed.imagePrompt ? 'Present' : 'Not found'
        });

        return {
            success: true,
            data: parsed
        };

    } catch (error) {
        logger.error('Content parsing failed', error);

        return {
            success: false,
            error: error.message,
            rawContent: content // Include raw content for debugging
        };
    }
};
