/**
 * Logger Utility
 * Provides consistent terminal logging with timestamps
 */

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

const getTimestamp = () => {
    return new Date().toISOString();
};

export const logger = {
    info: (message, data = null) => {
        console.log(`${colors.cyan}[INFO]${colors.reset} ${colors.dim}${getTimestamp()}${colors.reset} - ${message}`);
        if (data) console.log(data);
    },

    success: (message, data = null) => {
        console.log(`${colors.green}[SUCCESS]${colors.reset} ${colors.dim}${getTimestamp()}${colors.reset} - ${message}`);
        if (data) console.log(data);
    },

    warn: (message, data = null) => {
        console.log(`${colors.yellow}[WARN]${colors.reset} ${colors.dim}${getTimestamp()}${colors.reset} - ${message}`);
        if (data) console.log(data);
    },

    error: (message, error = null) => {
        console.log(`${colors.red}[ERROR]${colors.reset} ${colors.dim}${getTimestamp()}${colors.reset} - ${message}`);
        if (error) {
            console.error(error);
        }
    },

    phase: (phaseNumber, message) => {
        console.log(`\n${colors.bright}${colors.magenta}[PHASE ${phaseNumber}]${colors.reset} ${message}\n`);
    },

    step: (message) => {
        console.log(`  ${colors.blue}→${colors.reset} ${message}`);
    }
};
