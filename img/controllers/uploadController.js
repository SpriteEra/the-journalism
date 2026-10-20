import path from 'path';
import { promises as fs } from 'fs';
import ffmpeg from 'fluent-ffmpeg';

import {
    compressedDir,
    tempDir,
    copyAndDelete
} from '../config/uploadConfig.js';
import { parseUpload } from '../middlewares/uploadMiddleware.js';

const exists = async (path) => {
    try {
        await fs.access(path);
        return true;
    } catch {
        return false;
    }
};

const compressVideo = async (inputPath, tempOutputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .videoCodec('libx264')
            .audioCodec('aac')
            .outputOptions([
                '-crf 24',
                '-preset veryfast',
                '-movflags +faststart',
                '-profile:v high',
                '-pix_fmt yuv420p',
                '-vf scale=960:-2',
                '-b:v 1000k',
                '-b:a 128k',
                '-ac 2'
            ])
            .on('start', (commandLine) => {
                console.log('FFmpeg command:', commandLine);
            })
            .on('progress', (progress) => {
                console.log(`Processing: ${Math.round(progress.percent)}% done`);
            })
            .on('end', () => {
                copyAndDelete(tempOutputPath, outputPath)
                    .then(resolve)
                    .catch(reject);
            })
            .on('error', reject)
            .save(tempOutputPath);
    });
};

const handleUpload = async (req, res) => {
    console.log('Upload request received');

    try {
        const [fields, files] = await parseUpload(req);
        console.log('Form parsed successfully');

        const file = files.file?.[0];
        if (!file) {
            console.log('No valid video file uploaded');
            return res.status(400).json({
                success: false,
                message: 'No valid video file uploaded. Supported formats: MP4, MOV, AVI, MKV'
            });
        }

        const inputPath = file.filepath;
        const originalFilename = file.originalFilename;
        const outputFilename = `compressed_${Date.now()}${path.extname(originalFilename)}`;
        const outputPath = path.join(compressedDir, outputFilename);
        const tempOutputPath = path.join(tempDir, outputFilename);

        if (!await exists(inputPath)) {
            console.log('Uploaded file not found at path:', inputPath);
            return res.status(400).json({
                success: false,
                message: 'Uploaded file not found'
            });
        }

        console.log(`Starting compression for ${originalFilename}`);
        await compressVideo(inputPath, tempOutputPath, outputPath);
        console.log('Compression finished successfully');

        const stats = await fs.stat(outputPath);

        res.json({
            success: true,
            message: 'Upload and compression successful',
            originalFile: originalFilename,
            compressedFile: outputFilename,
            size: stats.size,
            downloadUrl: `/compressed/${outputFilename}`
        });

    } catch (error) {
        console.error('Processing error:', error);

        let message = 'Processing failed';
        if (error.message.includes('maxFileSize exceeded')) {
            message = 'File size exceeds 500MB limit';
        } else if (error.message.includes('invalid file type')) {
            message = 'Invalid file type. Supported formats: MP4, MOV, AVI, MKV';
        }

        res.status(500).json({
            success: false,
            message: message
        });
    }
};

export { handleUpload };