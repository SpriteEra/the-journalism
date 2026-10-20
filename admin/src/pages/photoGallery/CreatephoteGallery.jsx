import React, { useState } from "react";
import httpClient from "../../api/httpClient";
import {
  Camera,
  Plus,
  X,
  MapPin,
  Calendar,
  Edit3,
  Image,
  Eye,
  ArrowLeft,
  Loader2,
  User,
} from "lucide-react";
import { Upload } from "lucide-react";
import InputFields from "../../utils/InputFields";
import TextareaFields from "../../utils/TextareaFields";
import toast from "react-hot-toast";
import { compressImage } from "../../utils/utils";
import ImageUploader from "../../utils/ImageUpload";
import Tag from "../../utils/Tag";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
const CreatephoteGallery = () => {
  const [mainArticle, setMainArticle] = useState({
    title: "",
    description: "",
    location: "",
    tags: [],
    ref_reporter: "",
  });
  const [tagdata, setTagData] = useState("");
  const tagLimit = 20;
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [newPhoto, setNewPhoto] = useState({
    preview: null,
    file: null,
    title: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const queryClient = useQueryClient();
  const handleMainArticleChange = (field, value) => {
    setMainArticle((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validatePhoto = () => {
    const newErrors = {};
    if (!newPhoto.file) {
      newErrors.image = "Image is required";
      toast.error("Image is required");
    }
    if (!newPhoto.title.trim()) {
      toast.error("Title is required");
      return false;
    }
    if (!newPhoto.description.trim()) {
      toast.error("Description is required");
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addPhoto = () => {
    if (validatePhoto()) {
      setPhotos((prev) => [
        ...prev,
        {
          ...newPhoto,
          id: Date.now(),
          // Keep both preview URL and file object
          image: newPhoto.preview, // For display purposes
          file: newPhoto.file, // For backend upload
        },
      ]);
      setNewPhoto({ preview: null, file: null, title: "", description: "" });
      setShowAddPhoto(false);
      setErrors({});
    }
  };

  const validateMainArticle = () => {
    const newErrors = {};
    let isValid = true;

    if (!mainArticle.title.trim()) {
      newErrors.title = "Title is required";
      toast.error("Article title is required");
      return;
    }

    if (!mainArticle.description.trim()) {
      newErrors.description = "Description is required";
      toast.error("Article description is required");
      isValid = false;
      return;
    }

    if (!mainArticle.location.trim()) {
      newErrors.location = "Location is required";
      toast.error("Location is required");
      isValid = false;
      return;
    }

    if (!mainArticle.tags || mainArticle.tags.length === 0) {
      newErrors.tags = "At least one tag is required";
      toast.error("At least one tag is required");
      isValid = false;
      return;
    }

    if (photos.length === 0) {
      newErrors.photos = "At least one photo is required";
      toast.error("At least one photo is required for the gallery");
      isValid = false;
      return;
    }

    setErrors(newErrors);
    return isValid;
  };

  const validateDraft = () => {
    if (!mainArticle.title.trim()) {
      toast.error("Article title is required to save as draft");
      return false;
    }
    return true;
  };

  const removePhoto = (id) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== id));
  };

  const cancelAddPhoto = () => {
    setNewPhoto({ preview: null, file: null, title: "", description: "" });
    setShowAddPhoto(false);
    setErrors({});
  };
  const navigate = useNavigate();

  const handleSaveAsDraft = async () => {
    // Validate title before saving draft
    if (!validateDraft()) {
      return;
    }

    setIsSavingDraft(true);
    toast.loading("Saving as draft...", { id: "draft-toast" });

    try {
      // Your existing API call code remains unchanged
      const formData = new FormData();

      formData.append("title", mainArticle.title);
      formData.append("description", mainArticle.description);
      formData.append("location", mainArticle.location);
      formData.append("ref_reporter", mainArticle.ref_reporter);
      formData.append("draft", true);
      formData.append("tags", JSON.stringify(mainArticle.tags));

      // Prepare photo metadata array
      const photosMetadata = [];

      for (let i = 0; i < photos.length; i++) {
        let file = photos[i].file;
        if (!file) continue;

        if (file.size > 1024 * 1024) {
          file = await compressImage(file);
        }

        // Append the ith photo file with unique key
        formData.append(`photoFiles[${i}]`, file, file.name);

        // Push metadata for the photo
        photosMetadata.push({
          title: photos[i].title,
          description: photos[i].description,
        });
      }

      // Append JSON stringified metadata
      formData.append("photos", JSON.stringify(photosMetadata));

      const { data } = await httpClient.post("/create-gallery-news", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Draft saved successfully!", { id: "draft-toast" });
      navigate("/dashboard/draft-photo-gallery");
      queryClient.invalidateQueries({
        queryKey: ["gallery-news"],
      });
    } catch (error) {
      console.error("Draft saving error:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "something went wrong",
        {
          id: "draft-toast",
        }
      );
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    // Validate before publishing
    if (!validateMainArticle()) {
      return;
    }

    setIsPublishing(true);
    toast.loading("Publishing your article...", { id: "publish-toast" });

    try {
      // Your existing API call code remains unchanged
      const formData = new FormData();

      formData.append("title", mainArticle.title);
      formData.append("description", mainArticle.description);
      formData.append("location", mainArticle.location);
      formData.append("tags", JSON.stringify(mainArticle.tags));
      formData.append("ref_reporter", mainArticle.ref_reporter);

      // Prepare photo metadata array
      const photosMetadata = [];

      for (let i = 0; i < photos.length; i++) {
        let file = photos[i].file;
        if (!file) continue;

        if (file.size > 1024 * 1024) {
          file = await compressImage(file);
        }

        // Append the ith photo file with unique key
        formData.append(`photoFiles[${i}]`, file, file.name);

        // Push metadata for the photo
        photosMetadata.push({
          title: photos[i].title,
          description: photos[i].description,
        });
      }

      // Append JSON stringified metadata
      formData.append("photos", JSON.stringify(photosMetadata));

      const { data } = await httpClient.post("/create-gallery-news", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Article published successfully!", { id: "publish-toast" });
      navigate("/dashboard/photo-gallery");
      queryClient.invalidateQueries({
        queryKey: ["gallery-news"],
      });
    } catch (error) {
      console.error("Publishing error:", error);
      toast.error(error.message || "An error occurred during publishing.", {
        id: "publish-toast",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  const handleKeyDown = (e) => {
    if (e.keyCode === 13 || e.keyCode === 188) {
      e.preventDefault();
      let tag = e.target.value;
      if (mainArticle.tags?.length < tagLimit) {
        if (!mainArticle.tags.includes(tag) && tag.length) {
          setMainArticle((prev) => ({
            ...prev,
            tags: [...prev.tags, tag],
          }));
        }
      } else {
        toast.error(`You can add max ${tagLimit} tags`);
      }
      setTagData("");
    }
  };

  const handleTag = () => {
    let tag = tagdata;
    if (mainArticle.tags?.length < tagLimit) {
      if (!mainArticle.tags.includes(tag) && tag.length) {
        setMainArticle((prev) => ({
          ...prev,
          tags: [...prev.tags, tag],
        }));
      }
    } else {
      toast.error(`You can add max ${tagLimit} tags`);
    }
    setTagData("");
  };

  // Preview Component
  const PreviewComponent = () => (
    <div className="min-h-screen bg-surface-2 p-1 rounded-md">
      <div className="mx-auto">
        {/* Preview Header */}
        <nav className="flex sm:px-3 mb-2 sm:mb-4 sticky -top-2 md:-top-6 z-10 bg-surface w-full p-2 justify-between ">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePreview}
              className="flex items-center gap-2 px-3 py-2 text-fg-muted hover:text-fg transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="max-sm:hidden">Back to Edit</span>
            </button>
            <div className="h-6 w-px bg-surface-3"></div>
            <p className="text-fg text-xl sm:text-xl lg:text-2xl font-medium">
              Article Preview
            </p>
          </div>
        </nav>

        {/* Preview Content */}
        <div className="max-w-4xl mx-auto">
          <article className="bg-surface rounded-lg shadow-lg overflow-hidden">
            {/* Article Header */}
            <div className="p-6 border-b border-line">
              <h1 className="text-3xl lg:text-4xl font-bold text-fg mb-4">
                {mainArticle.title || "Untitled Article"}
              </h1>

              <div className="flex items-center gap-4 text-sm text-fg-muted mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                {mainArticle.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{mainArticle.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Article Content */}
            <div className="p-6">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <p className="text-fg-muted leading-relaxed whitespace-pre-wrap">
                  {mainArticle.description ||
                    "No article content provided yet."}
                </p>
              </div>
            </div>

            {/* Photo Gallery Section */}
            {photos.length > 0 && (
              <div className="p-6 border-t border-line">
                <h2 className="text-2xl font-semibold text-fg mb-6 flex items-center gap-2">
                  <Camera className="w-6 h-6" />
                  Photo Gallery
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {photos.map((photo, index) => (
                    <div key={photo.id} className="group">
                      <div className="relative overflow-hidden rounded-lg bg-surface-2">
                        <img
                          src={photo.image}
                          alt={photo.title}
                          className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="mt-3">
                        <h3 className="font-semibold text-fg text-lg mb-1">
                          {photo.title}
                        </h3>
                        <p className="text-fg-muted text-sm leading-relaxed">
                          {photo.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty Gallery State */}
            {photos.length === 0 && (
              <div className="p-6 border-t border-line">
                <div className="text-center py-8">
                  <Camera className="w-12 h-12 text-fg-faint mx-auto mb-3" />
                  <p className="text-fg-subtle">
                    No photos in gallery yet
                  </p>
                </div>
              </div>
            )}
          </article>
        </div>
      </div>
    </div>
  );

  // If preview is active, show preview component
  if (showPreview) {
    return <PreviewComponent />;
  }

  // Main Editor Component
  return (
    <div className="min-h-screen bg-surface-2 p-1 rounded-md">
      <div className="mx-auto">
        {/* Header */}
        <nav className="flex sm:px-3 mb-2 sm:mb-4 sticky -top-2 md:-top-6 z-10 bg-surface w-full p-2 justify-between border">
          <p className="max-md:hidden text-fg line-clamp-1 text-xl sm:md:text-xl lg:text-2xl font-medium leading-7 sm:line-clamp-2 ">
            Create Photo Gallery
          </p>
          <div className="flex gap-1 sm:gap-3 items-center max-sm:justify-between max-sm:w-full">
            {/* Preview Button */}
            <button
              onClick={togglePreview}
              className="btn-blue-outline bg-surface hover:bg-surface-2 text-fg-muted border border-line-strong flex gap-1 items-center max-sm:text-sm"
            >
              <Eye size={20} className="max-sm:hidden" />
              Preview
            </button>

            <div className="h-6 w-px bg-surface-3"></div>

            <button
              className={`btn-blue bg-gradient-to-r max-sm:text-sm from-success to-success border-success flex items-center sm:gap-1 h-full ${
                isPublishing ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={handlePublish}
              disabled={isPublishing}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Publishing...
                </>
              ) : (
                <>
                  <Upload size={20} className="max-sm:hidden" />
                  Publish
                </>
              )}
            </button>
            <button
              className={`btn-blue-outline bg-surface hover:bg-surface-2 text-fg-muted border border-line-strong flex gap-1 items-center max-sm:text-sm ${
                isSavingDraft ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={handleSaveAsDraft}
              disabled={isSavingDraft}
            >
              {isSavingDraft ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Saving...
                </>
              ) : (
                <>
                  <span className="flex items-center space-x-2 max-sm:hidden">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </span>
                  Save Draft
                </>
              )}
            </button>
          </div>
        </nav>

        {/* Main Article Section */}
        <div className="mx-auto p-6 bg-surface rounded-lg shadow-lg w-full mb-8 max-w-4xl">
          <div className="flex items-center gap-2 mb-6">
            <Edit3 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-fg">
              Main Article
            </h2>
          </div>

          <div className="border border-line rounded-lg p-6 mb-6 bg-surface-2">
            <InputFields
              LabelTitle="Article Title"
              inputVal={mainArticle.title}
              handleInputValue={(e) =>
                handleMainArticleChange("title", e.target.value)
              }
              name="title"
              placeholder={"Enter article title..."}
              required={true}
            />

            <InputFields
              LabelTitle="Location"
              inputVal={mainArticle.location}
              handleInputValue={(e) =>
                handleMainArticleChange("location", e.target.value)
              }
              name="location"
              placeholder={"Enter location..."}
              icon={MapPin}
              required={true}
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-fg-muted mb-2 required">
                Tags - (Helps in searching and ranking your article)
              </label>
              <div className="flex flex-col w-full rounded-md p-4 bg-surface-2 border border-line">
                <div className="flex items-center">
                  <input
                    type="text"
                    value={tagdata}
                    placeholder="Add tags..."
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setTagData(e.target.value)}
                    className="flex-1 px-3 py-2 border border-line-strong rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    className="ml-2 p-2 bg-primary text-paper rounded-md hover:bg-primary-hover transition-colors"
                    onClick={handleTag}
                    type="button"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2">
                  {mainArticle.tags &&
                    mainArticle.tags.map((tag, i) => (
                      <Tag
                        key={i}
                        tagIndex={i}
                        tag={tag}
                        data={mainArticle.tags}
                        setData={(newTags) =>
                          setMainArticle((prev) => ({ ...prev, tags: newTags }))
                        }
                      />
                    ))}
                </div>
              </div>
              <p className="mt-1 text-sm text-fg-subtle text-right">
                {tagLimit - (mainArticle.tags?.length || 0)} Tags left
              </p>
            </div>
            <TextareaFields
              LabelTitle="Article Description"
              inputVal={mainArticle.description}
              handleInputValue={(e) =>
                handleMainArticleChange("description", e.target.value)
              }
              name="description"
              placeholder={"Enter description..."}
              required={true}
            />
            <InputFields
              LabelTitle="Reporter (Optional)"
              inputVal={mainArticle.ref_reporter}
              handleInputValue={(e) =>
                handleMainArticleChange("ref_reporter", e.target.value)
              }
              name="ref_reporter"
              placeholder={"Enter reporter"}
              icon={User}
            />
          </div>
        </div>

        {/* Photo Gallery Section */}
        <div className="mx-auto p-6 bg-surface rounded-lg shadow-lg w-full max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-fg required">
                Photo Gallery ({photos.length})
              </h2>
            </div>
            {!showAddPhoto && (
              <button
                onClick={() => setShowAddPhoto(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-paper rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Photo
              </button>
            )}
          </div>

          {/* Add Photo Form */}
          {showAddPhoto && (
            <div className="border border-line rounded-lg p-6 mb-6 bg-surface-2">
              <h3 className="text-lg font-medium text-fg mb-4">
                Add New Photo
              </h3>

              {/* Enhanced Photo Image Upload */}
              <ImageUploader
                imageFile={newPhoto}
                setImageFile={setNewPhoto}
                error={errors.image}
              />

              {/* Photo Title */}
              <InputFields
                LabelTitle="Photo Title"
                inputVal={newPhoto.title}
                handleInputValue={(e) =>
                  setNewPhoto((prev) => ({ ...prev, title: e.target.value }))
                }
                name="title"
                placeholder={"Enter photo title..."}
                required={true}
              />
              <TextareaFields
                LabelTitle="Photo Description"
                inputVal={newPhoto.description}
                handleInputValue={(e) =>
                  setNewPhoto((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                name="description"
                placeholder={"Describe this photo..."}
                required={true}
              />

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelAddPhoto}
                  className="px-4 py-2 border border-line-strong text-fg-muted rounded-lg hover:bg-surface-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addPhoto}
                  className="px-4 py-2 bg-success hover:bg-success text-paper rounded-lg transition-colors"
                >
                  Add Photo
                </button>
              </div>
            </div>
          )}

          {/* Photo Grid */}
          {photos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="bg-surface-2 rounded-lg overflow-hidden"
                >
                  <div className="relative">
                    <img
                      src={photo.image}
                      alt={photo.title}
                      className="w-full h-48 object-cover"
                    />
                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="absolute top-2 right-2 p-1 bg-danger text-paper rounded-full hover:bg-danger transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4">
                    <h4 className="font-medium text-fg mb-2 line-clamp-2">
                      {photo.title}
                    </h4>
                    <p className="text-sm text-fg-muted line-clamp-2">
                      {photo.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Camera className="w-16 h-16 text-fg-faint mx-auto mb-4" />
              <p className="text-fg-subtle text-lg">
                No photos added yet
              </p>
              <p className="text-fg-faint text-sm">
                Click "Add Photo" to start building your gallery
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatephoteGallery;
