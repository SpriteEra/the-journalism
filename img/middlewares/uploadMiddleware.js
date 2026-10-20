import formidable from "formidable";
import { uploadDir, isValidVideo } from "../config/uploadConfig.js";

const parseUpload = (req) => {
  return new Promise((resolve, reject) => {
    const form = formidable({
      uploadDir: uploadDir,
      keepExtensions: true,
      maxFileSize: 500 * 1024 * 1024, // 500MB
      multiples: false,
      filter: ({ name, originalFilename, mimetype }) => {
        return name === "file" && isValidVideo({ originalFilename, mimetype });
      },
    });

    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve([fields, files]);
    });
  });
};

export { parseUpload };
