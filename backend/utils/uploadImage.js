import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import axios from 'axios';
import FormData from 'form-data';

dotenv.config();

const __dirname = path.resolve();
const uploadsDir = path.join(__dirname, 'uploads');

// Ensure the uploads directory exists
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Uploads and processes an image.
 * @param {Buffer} fileBuffer - The image file buffer.
 * @param {string} originalName - The original file name.
 * @param {string} subfolder - The folder where the image should be saved.
 * @returns {Promise<string>} - Returns the image URL.
 */



/**
 * GET /<prefix>/*  -> uploads/<subfolder>/<name>.webp (falls back to the default banner).
 * Needs the static plugin registered with { root: <project>/uploads, serve: false } (see app.js).
 */
export const findImage = async (req, reply) => {
    const fullPath = String(req.params['*'] || '');                       // subfolder + image name
    const imageName = fullPath.split('/').pop();
    const subfolder = fullPath.split('/').slice(0, -1).join('/');
    const relative = path.posix.join(subfolder, `${imageName}.webp`);
    const safe = path.resolve(uploadsDir, relative).startsWith(uploadsDir + path.sep);    // no ../ escapes
    if (safe && fs.existsSync(path.join(uploadsDir, relative))) return reply.sendFile(relative);
    return reply.sendFile('vajra-banner.png');
};

export const uploadImage = async (buffer, originalName, subfolder = 'group-profile') => {
    try {
        const form = new FormData();
        form.append('image', buffer, {
            filename: originalName,
            contentType: 'image/png', // or dynamic type if you know it
        });
        form.append('subfolder', subfolder);

        const response = await axios.post(`${process.env.IMG_URL}/upload`, form, {
            headers: form.getHeaders()
        });

        return response.data; // Expected: image URL
    } catch (err) {
        console.error('Image upload failed:', err.message);
        throw new Error('Image Upload fail..')
    }
};
export const deleteImage = async (imageUrl) => {
    try {
        const response = await axios.delete(process.env.IMG_URL + '/deleteImage', {
            params: { url: imageUrl }
        });
        console.log('Image deleted successfully:', response.data);
        return response.data; // { message: 'Image deleted successfully.' }
    } catch (error) {
        console.error('Failed to delete image:', error.message);
        return 1
    }
};




export const uploadVideo = async (buffer, originalName, mimeType = 'video/mp4') => {
    try {
        const form = new FormData();
        form.append('file', buffer, {
            filename: originalName,
            contentType: mimeType
        });

        // Get the form headers including the boundary
        const formHeaders = form.getHeaders();

        const response = await axios.post(
            `${process.env.IMG_URL}/upload-video`,
            form,
            {
                headers: {
                    ...formHeaders, // This includes 'Content-Type': 'multipart/form-data; boundary=...'
                    'Content-Length': form.getLengthSync() // More accurate than buffer.length for multipart
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 600000 // 10 minutes timeout
            }
        );

        return response.data;
    } catch (err) {
        console.error('Video upload failed:', err);
        if (err.response) {
            console.error('Server response:', err.response.data);
        }
        return {
            success: false,
            message: err.message,
            downloadUrl: ""
        };
    }
};

/**
 * Stream a video from disk (the upload plugin's tempFiles mode) to the media server,
 * so big files never sit fully in RAM.
 */
export const uploadVideoFromPath = async (filePath, originalName, mimeType = 'video/mp4') => {
    try {
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath), { filename: originalName, contentType: mimeType });
        const length = await new Promise((resolve, reject) => form.getLength((e, l) => (e ? reject(e) : resolve(l))));
        const response = await axios.post(`${process.env.IMG_URL}/api/v1/upload-stream`, form, {
            headers: { ...form.getHeaders(), 'Content-Length': length },
            maxContentLength: Infinity, maxBodyLength: Infinity, timeout: 15 * 60 * 1000,
        });
        return response.data;
    } catch (err) {
        console.error('Video stream upload failed:', err.message);
        return { success: false, message: err.message, downloadUrl: '' };
    }
};
