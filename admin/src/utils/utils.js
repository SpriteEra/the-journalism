import imageCompression from "browser-image-compression";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en.json";

export const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
        case "success":
            return "text-success";
        case "pending":
            return "text-warning";
        case "failed":
            return "text-danger";
        default:
            return "text-fg-subtle";
    }
};

export const truncate = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
};

export const formatDate = (timestamp) => {
    // always shown in IST, whatever the browser's time zone is
    const d = new Date(timestamp);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }).format(d);
};


export const compressImage = async (imageFile, options = {}) => {
    if (!imageFile) throw new Error("No image file provided.");

    const defaultOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
    };

    const finalOptions = { ...defaultOptions, ...options };
    const fileSizeMB = imageFile.size / (1024 * 1024);

    if (fileSizeMB > finalOptions.maxSizeMB) {
        return await imageCompression(imageFile, finalOptions);
    }

    return imageFile; // Return original if below size limit
};


TimeAgo.addDefaultLocale(en);

// Create a formatter
const timeAgo = new TimeAgo("en-US");

export const getRelativeTime = (dateString) => {
    return timeAgo.format(new Date(dateString));
};

export const returnChar = (type) => {
    if (!type) {
        return 'O';
    }

    return type.split('')[0].toUpperCase();
}

export const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];

    for (let i = 0; i < 5; i++) {
        years.push((currentYear - i).toString());
    }

    return ["Select Year", ...years];
};
