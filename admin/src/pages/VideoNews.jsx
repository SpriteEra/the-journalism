import React, { useState } from "react";
import axios from "axios";

const VideoUpload = () => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const MAX_SIZE = 500 * 1024 * 1024; // 500MB

  const handleChange = (e) => {
    const selected = e.target.files[0];

    if (!selected) return;

    if (selected.size > MAX_SIZE) {
      alert("File size exceeds 500MB limit.");
      return;
    }

    setFile(selected);
    setStatus("");
    setUploadProgress(0);
    setCompressionProgress(0);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a video file first.");
      return;
    }

    setIsProcessing(true);
    setStatus("Uploading...");
    setUploadProgress(0);
    setCompressionProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/upload-stream",
        {
          method: "POST",
          body: formData,
          headers: {
            // Note: Don't manually set Content-Type for FormData — browser sets it with proper boundary
            // "Content-Type": "multipart/form-data", ❌ omit this
          },
          // credentials: 'include', // if using cookies and backend allows it
        }
      );

      const data = await response.json();

      if (data.success) {
        setStatus("Upload complete! Processing video...");

        const interval = setInterval(() => {
          setCompressionProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 5;
          });
        }, 500);

        setTimeout(() => {
          setResult(data);
          setStatus("Processing complete!");
          setIsProcessing(false);
        }, 3000);
      } else {
        setStatus("Upload failed");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setStatus("Upload failed");
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-surface shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">Video Upload</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-fg-muted mb-2">
          Choose a video file (max 500MB)
        </label>
        <input
          type="file"
          accept="video/*"
          onChange={handleChange}
          className="block w-full text-sm text-fg-subtle
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-primary-soft file:text-primary
            hover:file:bg-primary-soft"
          disabled={isProcessing}
        />
      </div>

      {file && (
        <div className="mb-4">
          <p className="text-sm text-fg-muted">
            Selected: {file.name} ({Math.round(file.size / (1024 * 1024))}MB)
          </p>
        </div>
      )}

      <button
        onClick={handleUpload}
        className={`w-full py-2 px-4 rounded-md text-paper font-medium
          ${
            !file || isProcessing
              ? "bg-line-strong cursor-not-allowed"
              : "bg-primary hover:bg-primary-hover"
          }
          transition-colors`}
        disabled={!file || isProcessing}
      >
        {isProcessing ? "Processing..." : "Upload & Compress"}
      </button>

      {status && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-1">{status}</p>

          {uploadProgress > 0 && (
            <div className="mb-2">
              <p className="text-xs text-fg-muted mb-1">
                Upload: {uploadProgress}%
              </p>
              <div className="w-full bg-surface-3 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {compressionProgress > 0 && (
            <div>
              <p className="text-xs text-fg-muted mb-1">
                Compression: {compressionProgress}%
              </p>
              <div className="w-full bg-surface-3 rounded-full h-2">
                <div
                  className="bg-success h-2 rounded-full"
                  style={{ width: `${compressionProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="mt-4 p-3 bg-success-soft rounded-md border border-success/30">
          <h3 className="font-medium text-success">Success!</h3>
          <p className="text-sm text-success mt-1">
            Your video has been compressed and is ready to download.
          </p>
          <a
            href={`http://localhost:5000/compressed/${result.compressedFile}`}
            download
            className="mt-2 inline-block px-3 py-1 bg-success text-paper text-sm rounded hover:bg-success transition-colors"
          >
            Download Compressed Video
          </a>
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
