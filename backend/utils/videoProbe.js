import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import os from 'os';
import path from 'path';

/** Reads duration / size of a video file. Returns {} when ffmpeg is not installed (never throws). */
export const probeVideo = (filePath) => new Promise((resolve) => {
    try {
        ffmpeg.ffprobe(filePath, (err, data) => {
            if (err || !data) return resolve({});
            const v = data.streams?.find((s) => s.codec_type === 'video') || {};
            resolve({ duration: Math.round(+data.format?.duration || 0), width: v.width || 0, height: v.height || 0 });
        });
    } catch { resolve({}); }
});

/** Grabs one frame at ~1s as a jpg buffer. Returns null when ffmpeg is missing. */
export const captureThumbnail = (filePath) => new Promise((resolve) => {
    try {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'thumb-'));
        ffmpeg(filePath)
            .on('end', () => {
                try { const buf = fs.readFileSync(path.join(dir, 'thumb.jpg')); fs.rmSync(dir, { recursive: true, force: true }); resolve(buf); }
                catch { resolve(null); }
            })
            .on('error', () => { fs.rmSync(dir, { recursive: true, force: true }); resolve(null); })
            .screenshots({ timestamps: ['00:00:01'], filename: 'thumb.jpg', folder: dir, size: '1280x?' });
    } catch { resolve(null); }
});
