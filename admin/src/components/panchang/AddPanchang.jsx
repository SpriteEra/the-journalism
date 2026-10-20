import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import httpClient from "../../api/httpClient";
import { compressImage } from "../../utils/utils";

const AddPanchang = ({ setAddPanchang, refetch, validateImageFile }) => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleImageUpload = (file) => {
    if (!file) return;

    if (!validateImageFile(file)) {
      return;
    }

    setImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleImageUpload(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!image) {
      toast.error("Please select an image to upload");
      return;
    }

    setIsUploading(true);
    const loadingToast = toast.loading("Uploading Panchang...");

    try {
      const formData = new FormData();
      let file = image;
      if (file.size > 1024 * 1024) {
        file = await compressImage(file);
      }
      formData.append("image", file);

      const response = await httpClient.post("add-panchang", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.dismiss(loadingToast);
      toast.success("Panchang uploaded successfully!");
      setAddPanchang(false);
      refetch();
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.message || "Failed to upload panchang");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload Area */}
        <div>
          {!imagePreview ? (
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragActive
                  ? "border-primary bg-primary-soft"
                  : "border-line-strong hover:border-line-strong"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon size={48} className="mx-auto text-fg-faint mb-4" />
              <p className="text-fg-muted mb-2 text-lg">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-fg-subtle">
                JPG, JPEG, PNG or GIF (Max 5MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif"
                onChange={handleFileInputChange}
                className="hidden"
                required
              />
            </div>
          ) : (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-80 object-cover rounded-lg border border-line-strong"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-3 right-3 p-2 bg-danger text-paper rounded-full hover:bg-danger transition-colors shadow-lg"
              >
                <X size={20} />
              </button>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-fg-muted truncate max-w-xs">
                  {image?.name}
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-primary hover:text-primary font-medium"
                >
                  Change Image
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isUploading || !image}
            className="flex-1 bg-primary text-paper py-3 px-4 rounded-lg hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isUploading ? "Uploading..." : "Upload Panchang"}
          </button>
          <button
            type="button"
            onClick={() => setAddPanchang(false)}
            disabled={isUploading}
            className="flex-1 bg-fg-faint text-paper py-3 px-4 rounded-lg hover:bg-surface-3 focus:outline-none focus:ring-2 focus:ring-line-strong disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPanchang;
