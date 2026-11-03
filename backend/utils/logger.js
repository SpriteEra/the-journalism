import fs from 'node:fs';
import path from 'node:path';
import pino from 'pino';

const isProd = process.env.NODE_ENV === 'production';
const LOG_DIR = path.resolve(process.env.LOG_DIR || 'logs');
const KEEP_DAYS = Number(process.env.LOG_KEEP_DAYS) || 15;       // ~1 month
const level = process.env.LOG_LEVEL || (isProd ? 'info' : 'debug');

/**
 * Shared options: used by this standalone logger AND by Fastify (app.js), so every line goes to the same places.
 *  - terminal : pretty + coloured in development, plain JSON in production (log tools read JSON)
 *  - file     : logs/app.<date>.<n>.log, a new file every day, JSON lines
 * pino-roll keeps only the newest KEEP_DAYS files, older ones are deleted by itself.
 */
export const loggerOptions = {
    level,                                                        // lowest level of all targets
    redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
    transport: {
        targets: [
            isProd
                ? { target: 'pino/file', level, options: { destination: 1 } }   // stdout as JSON
                : { target: 'pino-pretty', level, options: { colorize: true, translateTime: 'HH:MM:ss' } },
            {
                target: 'pino-roll',
                level: 'info',                                    // files hold info and above, never debug noise
                options: {
                    file: path.join(LOG_DIR, 'app'),
                    extension: '.log',
                    frequency: 'daily',
                    dateFormat: 'yyyy-MM-dd',
                    mkdir: true,
                    limit: { count: KEEP_DAYS },                  // 1 file per day -> about 1 month kept
                },
            },
        ],
    },
};

export const logger = pino(loggerOptions);

/**
 * Safety net: delete anything in the log folder older than KEEP_DAYS (by last-modified date).
 * Covers files left behind by an older run or a changed setting. Call it once at start-up (see index.js).
 */
export const purgeOldLogFiles = (days = KEEP_DAYS) => {
    try {
        if (!fs.existsSync(LOG_DIR)) return 0;
        const limit = Date.now() - days * 86400000;
        let removed = 0;
        for (const name of fs.readdirSync(LOG_DIR)) {
            if (!name.endsWith('.log')) continue;
            const file = path.join(LOG_DIR, name);
            if (fs.statSync(file).mtimeMs < limit) { fs.unlinkSync(file); removed += 1; }
        }
        return removed;
    } catch (err) {
        logger.warn({ err }, 'Could not clean old log files');
        return 0;
    }
};

export default logger;