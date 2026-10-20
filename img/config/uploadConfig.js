import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';

// ES modules equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure directories exist
const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

const uploadDir = path.join(__dirname, '../uploads/original');
const compressedDir = path.join(__dirname, '../uploads/compressed');
const tempDir = path.join(__dirname, '../uploads/temp');

ensureDir(uploadDir);
ensureDir(compressedDir);
ensureDir(tempDir);

const isValidVideo = ({ originalFilename, mimetype }) => {
    if (!originalFilename) return false;

    const validExtensions = ['.mp4', '.mov', '.avi', '.mkv'];
    const ext = path.extname(originalFilename).toLowerCase();

    const validMimeTypes = [
        'video/mp4',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-matroska'
    ];

    return validExtensions.includes(ext) && validMimeTypes.includes(mimetype);
};

const copyAndDelete = async (source, destination) => {
    await fs.copy(source, destination);
    await fs.remove(source);
};

export {
    uploadDir,
    compressedDir,
    tempDir,
    isValidVideo,
    copyAndDelete
};