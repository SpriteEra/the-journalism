import fp from 'fastify-plugin';
import multipart from '@fastify/multipart';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import ErrorHandler from '../utils/errorHandler.js';

const MB = 1024 * 1024;

/**
 * multipart/form-data -> request.body (text fields) + request.files (uploaded files), same shape the controllers always used:
 *   request.files.banner = { name, data:Buffer, size, mimetype, encoding, mv(dest) }          (repeated field => array)
 * Per-route override via route config:  { config: { upload: { maxMb: 300, tempFiles: true } } }
 *   tempFiles streams the file to disk (request.files.video.tempFilePath, data is empty) and deletes it after the response.
 * Files over the limit answer 413 (they used to be silently cut). Runs AFTER the route's onRequest hooks, so
 * anonymous requests are rejected by auth before a single byte is stored.
 */
export default fp(async (app, opts = {}) => {
    const defaultMb = opts.maxMb || 10;
    await app.register(multipart, { limits: { fileSize: defaultMb * MB, files: 25, fields: 300, parts: 350, fieldSize: 2 * MB } });

    const add = (map, key, value) => {
        if (!(key in map)) map[key] = value;
        else map[key] = Array.isArray(map[key]) ? [...map[key], value] : [map[key], value];
    };
    const tooLarge = (name, mb) => new ErrorHandler(413, `File "${name}" is larger than ${mb} MB`);

    app.addHook('preValidation', async (request) => {
        if (!request.isMultipart()) return;
        const cfg = request.routeOptions?.config?.upload || {};
        const maxMb = cfg.maxMb || defaultMb;
        const body = {}; const files = {};

        for await (const part of request.parts({ limits: { fileSize: maxMb * MB, files: cfg.files || 25 } })) {
            if (part.type !== 'file') { add(body, part.fieldname, part.value); continue; }
            if (!part.filename) { part.file.resume(); continue; }          // an empty file input

            const meta = { name: part.filename, mimetype: part.mimetype, encoding: part.encoding, truncated: false };
            if (cfg.tempFiles) {
                const dir = path.join(os.tmpdir(), 'news-uploads');
                await fs.promises.mkdir(dir, { recursive: true });
                const tmp = path.join(dir, `${randomUUID()}${path.extname(part.filename).slice(0, 12)}`);
                (request.tempFiles ||= []).push(tmp);
                await pipeline(part.file, fs.createWriteStream(tmp));
                if (part.file.truncated) throw tooLarge(part.filename, maxMb);
                const { size } = await fs.promises.stat(tmp);
                add(files, part.fieldname, { ...meta, data: Buffer.alloc(0), size, tempFilePath: tmp, mv: (dest) => fs.promises.copyFile(tmp, dest) });
            } else {
                let data;
                try { data = await part.toBuffer(); } catch (e) { throw e.code === 'FST_REQ_FILE_TOO_LARGE' ? tooLarge(part.filename, maxMb) : e; }
                add(files, part.fieldname, { ...meta, data, size: data.length, mv: (dest) => fs.promises.writeFile(dest, data) });
            }
        }
        request.body = body;
        request.files = Object.keys(files).length ? files : undefined;
    });

    const cleanup = async (request) => { for (const f of request.tempFiles || []) await fs.promises.rm(f, { force: true }).catch(() => { }); };
    app.addHook('onResponse', cleanup);
    app.addHook('onRequestAbort', cleanup);
}, { name: 'uploads' });
