import React, { useRef, useState } from "react";
import { X, Image, Upload } from "lucide-react";

const ImageUploader = ({ imageFile, setImageFile, error }) => {
  const fileRef = useRef();
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file) => {
    if (file && file.type.startsWith("image/")) {
      setImageFile({ ...imageFile, preview: URL.createObjectURL(file), file });
    }
  };

  const handleChange = (e) => {
    handleFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeImage = () => {
    setImageFile({
      ...imageFile,
      preview: null,
      file: null,
      originalImage: null,
    });
    fileRef.current.value = null;
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-fg mb-3 required">
        Upload Photo
      </label>

      {imageFile.preview ? (
        <div className="relative group">
          <div className="overflow-hidden rounded-xl shadow-lg ring-1 ring-line">
            <img
              src={imageFile.preview}
              alt="Uploaded preview"
              className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <button
            onClick={removeImage}
            className="absolute top-3 right-3 p-2 bg-danger text-paper rounded-full shadow-lg hover:bg-danger hover:scale-110 transition-all duration-200 opacity-90 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute inset-0 bg-ink/0 group-hover:10 transition-all duration-300 rounded-xl pointer-events-none" />
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer group ${
            isDragging
              ? "border-primary bg-gradient-to-br from-primary-soft to-primary-soft scale-102 shadow-lg"
              : error
              ? "border-danger bg-danger-soft"
              : "border-line-strong hover:border-primary hover:bg-surface-2 hover:shadow-md"
          }`}
        >
          <input
            type="file"
            accept="image/*"
            ref={fileRef}
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="flex flex-col items-center space-y-4">
            <div
              className={`p-4 rounded-full transition-all duration-300 ${
                isDragging
                  ? "bg-primary-soft scale-110"
                  : "bg-surface-2 group-hover:bg-primary-soft"
              }`}
            >
              {isDragging ? (
                <Upload className="w-8 h-8 text-primary" />
              ) : (
                <Image className="w-8 h-8 text-fg-subtle group-hover:text-primary transition-colors duration-300" />
              )}
            </div>

            <div className="space-y-2">
              <p
                className={`font-medium transition-colors duration-300 ${
                  isDragging
                    ? "text-primary"
                    : "text-fg-muted group-hover:text-primary"
                }`}
              >
                {isDragging ? "Drop your image here" : "Click or drag and drop"}
              </p>
              <p className="text-sm text-fg-subtle">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>

            <button
              type="button"
              className="px-4 py-2 bg-primary text-paper rounded-lg text-sm font-medium hover:bg-primary transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              Browse Files
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-danger-soft border border-danger/30 rounded-lg">
          <p className="text-danger text-sm font-medium flex items-center">
            <X className="w-4 h-4 mr-2" />
            {error}
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
