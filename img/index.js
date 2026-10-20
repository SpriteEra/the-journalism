import express from "express";
import cors from 'cors';
import multer from "multer";
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import os from 'os';
import { createClient } from 'redis';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { formidable } from 'formidable';
const ffmpegPath = ffmpegInstaller.path;
ffmpeg.setFfmpegPath(ffmpegPath);
// Configure __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express();
app.use(express.json({ limit: "110mb" }));
dotenv.config();

const allowedOrigins = [
    process.env.SERVER_URL,
    process.env.ADMIN_URL,
];

const apiCors = cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, origin);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
});


const PORT = process.env.PORT || 8000;


// const redisClient = createClient();

// redisClient.on('error', (err) => console.error('Redis Client Error', err));

// await redisClient.connect(); // Make sure to call this before using

// Configure directories
const uploadsDir = path.join(__dirname, 'uploads');
const videoUploadDir = path.join(uploadsDir, 'original-videos');
const videoDir = path.join(uploadsDir, 'videos');
const tempDir = path.join(os.tmpdir(), 'video_processing');
const deleteQueueDir = path.join(uploadsDir, 'delete-queue');

// Ensure directories exist
const ensureDirectories = async () => {
    try {
        await fs.promises.mkdir(uploadsDir, { recursive: true });
        await fs.promises.mkdir(videoUploadDir, { recursive: true });
        await fs.promises.mkdir(videoDir, { recursive: true });
        await fs.promises.mkdir(tempDir, { recursive: true });
        await fs.promises.mkdir(deleteQueueDir, { recursive: true });
        console.log('All directories ready');
    } catch (err) {
        console.error('Failed to create directories:', err);
        process.exit(1);
    }
};

ensureDirectories();

const copyAndDelete = async (src, dest) => {
    await fs.promises.copyFile(src, dest);
    await fs.promises.unlink(src);
};

// Helper function to validate video file
const isValidVideo = (file) => {
    if (!file) return false;
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
    const ext = path.extname(file.originalFilename).toLowerCase();
    return validTypes.includes(file.mimetype) || ['.mp4', '.mov', '.avi', '.mkv'].includes(ext);
};

app.post('/api/v1/upload-stream', apiCors, async (req, res) => {
    console.log('Upload request received');


    // Ensure directories exist

    const form = formidable({
        uploadDir: videoUploadDir, // Save original videos here
        keepExtensions: true,
        maxFileSize: 500 * 1024 * 1024, // 500MB
        multiples: false,
        filter: ({ name, originalFilename, mimetype }) => {
            return name === 'file' && isValidVideo({ originalFilename, mimetype });
        }
    });

    const [fields, files] = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) reject(err);
            else resolve([fields, files]);
        });
    });

    console.log('Form parsed successfully');

    const file = files.file?.[0];
    if (!file) {
        throw new Error('No valid video file uploaded. Supported formats: MP4, MOV, AVI, MKV');
    }


    const inputPath = file.filepath;
    const originalFilename = file.originalFilename;
    const uniqueName = uuidv4();
    const fileExt = path.extname(originalFilename);

    const outputFilename = `${uniqueName}${fileExt}`;
    const outputPath = path.join(videoDir, outputFilename);
    const tempOutputPath = path.join(tempDir, outputFilename);

    // if (!await exists(inputPath)) {
    //     throw new Error('Uploaded file not found');
    // }

    // console.log(`Starting compression for ${originalFilename}`);

    await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .videoCodec('libx264')
            .audioCodec('aac')
            .outputOptions([
                '-crf 20',
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
                // console.log('FFmpeg command:', commandLine);
            })
            .on('progress', (progress) => {
                // console.log(`Processing: ${Math.round(progress.percent)}% done`);
            })
            .on('end', () => {
                // Move from temp to final location
                copyAndDelete(tempOutputPath, outputPath)
                    .then(() => {
                        console.log('Compression finished successfully');
                        resolve();
                    })
                    .catch(reject);
            })
            .on('error', reject)
            .save(tempOutputPath);
    });

    // Move original file to delete queue for later cleanup
    const deleteQueuePath = path.join(deleteQueueDir, path.basename(inputPath));
    await fs.promises.rename(inputPath, deleteQueuePath);

    const stats = await fs.promises.stat(outputPath);
    const baseUrl = process.env.IMG_URL || 'http://localhost:8000';
    res.json({
        success: true,
        url: `${baseUrl}/videos/${outputFilename}`,
        message: 'Upload and compression successful',
        originalFile: originalFilename,
        compressedFile: outputFilename,
        size: stats.size,
        downloadUrl: `/videos/${outputFilename}`
    });

});

app.use('/videos', express.static(videoDir));



const upload = multer({ storage: multer.memoryStorage() });

/**
 * Uploads and processes an image.
 * @param {Buffer} fileBuffer - The image file buffer.
 * @param {string} originalName - The original file name.
 * @param {string} subfolder - The folder where the image should be saved.
 * @returns {Promise<string>} - Returns the image URL.
 */

app.post('/upload', apiCors, upload.fields([{ name: 'image' }, { name: 'file' }]), async (req, res) => {
    const file = req.files['image']?.[0] || req.files['file']?.[0];
    const baseSubfolder = req.body.subfolder || 'images';

    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    // Get today's date (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    // Final folder path: e.g., "news/2025-06-05"
    const subfolder = path.join(baseSubfolder, today);
    const userDir = path.join(uploadsDir, subfolder);

    // Create directory if it doesn't exist
    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
    }

    // Generate unique image name
    const uniqueName = uuidv4();
    const imageName = `${uniqueName}.webp`;
    const outputPath = path.join(userDir, imageName);

    // Convert and save the image
    await sharp(file.buffer).webp({ quality: 75 }).toFile(outputPath);

    // Generate and return image URL
    const url = `${process.env.IMG_URL}/image/${subfolder}/${imageName}`;
    return res.json(url);
});


const migrateImagesToWebp = async () => {
    const folderPath = path.resolve('./uploads/images');
    const baseUrl = process.env.IMG_URL || 'http://localhost:8000';

    const files = fs.readdirSync(folderPath);
    const uploadedUrls = [];

    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        const allowed = ['.jpg', '.jpeg', '.png'];
        if (!allowed.includes(ext)) continue;

        const fullPath = path.join(folderPath, file);
        const filenameWithoutExt = path.basename(file, ext);
        const newFilename = `${filenameWithoutExt}.webp`;
        const newPath = path.join(folderPath, newFilename);

        try {
            // Convert and save as .webp
            await sharp(fullPath).webp({ quality: 75 }).toFile(newPath);

            // Delete original file
            fs.unlinkSync(fullPath);

            const imageUrl = `${baseUrl}/image/${newFilename}`;
            uploadedUrls.push(imageUrl);

        } catch (err) {
            console.error(`❌ Failed to process ${file}: ${err.message}`);
        }
    }

    console.log('🎉 Migration complete!');
    return uploadedUrls;
};
// migrateImagesToWebp().then((urls) => {
//     console.log('Uploaded URLs:', urls);
// }).catch((err) => {
//     console.log(err)
// });

app.get(/^\/image\/(.+)$/, async (req, res) => {
    try {
        const fullPath = req.params[0];
        const imageName = fullPath.split('/').pop(); // filename without extension
        const subfolder = fullPath.split('/').slice(0, -1).join('/') || 'images';

        let imagePath = path.join(__dirname, 'uploads', subfolder, `${imageName}`);

        if (!fs.existsSync(imagePath)) {
            // fallback to default image
            imagePath = path.join(__dirname, 'uploads', 'banner.webp');
            console.warn("File not found, using fallback:", imagePath);
        }

        // Parse query params
        const width = parseInt(req.query.w);
        const quality = parseInt(req.query.q) || 75;
        const cacheKey = `img:${subfolder}/${imageName}:w${width || 'auto'}:q${quality}`;

        // Try to get from cache
        // try {
        //     const cachedImage = await redisClient.get(cacheKey);
        //     if (cachedImage) {
        //         res.set('Content-Type', 'image/webp');
        //         return res.send(Buffer.from(cachedImage, 'base64'));
        //     }
        // } catch (cacheErr) {
        //     console.warn("Redis cache read error:", cacheErr.message);
        // }

        // Prepare image with sharp
        let image = sharp(imagePath).webp({ quality });

        if (width && !isNaN(width)) {
            image = image.resize({ width });
        }

        const buffer = await image.toBuffer();

        // Try to set in cache
        // try {
        //     await redisClient.set(cacheKey, buffer.toString('base64'), { EX: 3600 }); // 1 hour
        // } catch (cacheErr) {
        //     console.warn("Redis cache write error:", cacheErr.message);
        // }

        res.set('Content-Type', 'image/webp');
        res.send(buffer);
    } catch (err) {
        console.error("Error processing image:", err);
        res.status(500).send('Error processing image.');
    }
});

app.delete('/deleteImage', (req, res) => {
    const { url: imageUrl } = req.query;

    try {
        const { pathname } = new URL(imageUrl);
        const pathParts = pathname.split('/').filter(Boolean);

        // Expected pathParts: ['image', 'news', '2025-06-05', 'filename.webp']
        if (pathParts.length < 4) {
            return res.status(400).json({ message: 'Invalid image URL structure.' });
        }

        // Reconstruct the full subfolder path from index 1 to n-2
        const subfolder = pathParts.slice(1, -1).join('/'); // 'news/2025-06-05'
        const imageName = pathParts[pathParts.length - 1];  // 'filename.webp'

        const imagePath = path.join(__dirname, 'uploads', subfolder, imageName);

        if (!fs.existsSync(imagePath)) {
            return res.status(404).json({ message: 'Image not found in uploads.' });
        }

        const deleteQueueDir = path.join(__dirname, 'uploads', 'delete-queue');
        if (!fs.existsSync(deleteQueueDir)) {
            fs.mkdirSync(deleteQueueDir, { recursive: true });
        }

        const taskFilePath = path.join(deleteQueueDir, `${Date.now()}__${subfolder.replace(/\//g, '__')}__${imageName}.json`);
        fs.writeFileSync(taskFilePath, JSON.stringify({ path: imagePath }));

        return res.json({ message: 'Delete scheduled. File will be removed later.' });

    } catch (error) {
        console.error('Error scheduling deletion:', error.message);
        return res.status(500).json({ message: 'Failed to schedule delete.', error: error.message });
    }
});




// const deleteQueueDir = path.
// join(__dirname, 'uploads', 'delete-queue');
// Unified deletion cron job (runs every minute)



cron.schedule('0 * * * *', async () => {
    try {
        const files = await fs.promises.readdir(deleteQueueDir);
        for (const file of files) {
            const fullPath = path.join(deleteQueueDir, file);

            if (file.endsWith('.json')) {
                // 🔄 Process .json deletion task
                try {
                    const content = await fs.promises.readFile(fullPath, 'utf-8');
                    const { path: fileToDelete } = JSON.parse(content);

                    try {
                        await fs.promises.unlink(fileToDelete);
                        // console.log(`✅ Deleted: ${fileToDelete}`);
                    } catch (deleteErr) {
                        if (deleteErr.code === 'EBUSY') {
                            console.warn(`⏳ File busy, will retry: ${fileToDelete}`);
                            continue;
                        } else if (deleteErr.code === 'ENOENT') {
                            console.warn(`⚠️ File not found, removing task: ${fileToDelete}`);
                        } else {
                            throw deleteErr;
                        }
                    }

                    // 🧹 Remove the JSON task file itself
                    await fs.promises.unlink(fullPath);

                } catch (parseErr) {
                    console.error(`❌ Error processing task ${file}:`, parseErr.message);
                    const corruptedPath = path.join(deleteQueueDir, 'corrupted', file);
                    await fs.promises.mkdir(path.dirname(corruptedPath), { recursive: true });
                    await fs.promises.rename(fullPath, corruptedPath);
                }
            } else {
                // 🔥 Directly delete any other file (video, image, temp, etc.)
                try {
                    await fs.promises.unlink(fullPath);
                    // console.log(`🧹 Deleted file directly: ${file}`);
                } catch (err) {
                    if (err.code === 'ENOENT') {
                        console.warn(`⚠️ File not found: ${file}`);
                    } else {
                        console.error(`❌ Failed to delete ${file}:`, err.message);
                    }
                }
            }
        }
    } catch (err) {
        console.error('🚨 Error in deletion cron job:', err);
    }
});



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});