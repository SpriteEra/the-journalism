import React, { useEffect, useState } from "react";
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
  Edit2,
  Loader2,
  User,
} from "lucide-react";
import { Upload } from "lucide-react";
import InputFields from "../../utils/InputFields";
import TextareaFields from "../../utils/TextareaFields";
import toast from "react-hot-toast";
import ImageUploader from "../../utils/ImageUpload";
import { useNavigate, useParams } from "react-router-dom";
import Tag from "../../utils/Tag";
import { useQueryClient } from "@tanstack/react-query";

const UpdateDraftPhotoGallery = () => {
  const [tagdata, setTagData] = useState("");
  const tagLimit = 20;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  // Update your mainArticle state to include tags
  const [mainArticle, setMainArticle] = useState({
    title: "",
    description: "",
    location: "",
    tags: [],
    ref_reporter: "",
  });
  const [article, setArticle] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [showEditPhoto, setShowEditPhoto] = useState(false);
  const [editingPhotoId, setEditingPhotoId] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [newPhoto, setNewPhoto] = useState({
    preview: null,
    file: null,
    title: "",
    description: "",
  });
  const [editPhoto, setEditPhoto] = useState({
    preview: null,
    file: null,
    title: "",
    description: "",
    originalImage: "",
  });
  const [errors, setErrors] = useState({});
  const [loadingStates, setLoadingStates] = useState({
    updatingPhoto: null, // photo id being updated
    deletingPhoto: null, // photo id being deleted
    addingPhoto: false, // adding new photo
    finalUpdate: false, // final update loading
  });
  const { news_id } = useParams();

  const handleMainArticleChange = (field, value) => {
    setMainArticle((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validatePhoto = (photoData = newPhoto) => {
    const newErrors = {};
    if (!photoData.file && !photoData.originalImage) {
      newErrors.image = "Image is required";
      toast.error("Image is required");
    }
    if (!photoData?.title?.trim()) {
      toast.error("Title is required");
      return false;
    }
    if (!photoData?.description?.trim()) {
      toast.error("Description is required");
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addPhoto = async () => {
    if (validatePhoto()) {
      try {
        // Set loading state for adding photo
        setLoadingStates((prev) => ({
          ...prev,
          addingPhoto: true,
        }));

        const formData = new FormData();
        formData.append("title", newPhoto.title);
        formData.append("description", newPhoto.description);
        formData.append("news_id", news_id);

        // Append the image file
        if (newPhoto.file) {
          formData.append("image", newPhoto.file, newPhoto.file.name);
        }

        const { data } = await httpClient.post(`/add-photo`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        setPhotos((prev) => [
          ...prev,
          {
            id: data?.data.photo?._id, // Use the actual ID from backend
            title: data?.data.photo?.title,
            description: data?.data?.photo?.description,
            image: data?.data.photo?.image,
            file: null, // Clear file reference
            preview: data?.data.photo?.image,
          },
        ]);

        // Reset form and close modal
        setNewPhoto({ preview: null, file: null, title: "", description: "" });
        setShowAddPhoto(false);
        setErrors({});
        toast.success("Photo added successfully!");
      } catch (error) {
        console.error("Photo addition failed:", error);
        toast.error(error?.response?.data?.message || "Failed to add photo");
      } finally {
        setLoadingStates((prev) => ({ ...prev, addingPhoto: false }));
      }
    }
  };
  const startEditPhoto = (photo) => {
    setEditingPhotoId(photo.id);
    setEditPhoto({
      preview: photo.image,
      file: null,
      title: photo.title,
      description: photo.description,
      originalImage: photo.image,
    });
    setShowEditPhoto(true);
    setShowAddPhoto(false);
  };

  const updatePhoto = async () => {
    console.log(editPhoto);
    if (validatePhoto(editPhoto)) {
      try {
        setLoadingStates((prev) => ({
          ...prev,
          updatingPhoto: editingPhotoId,
        }));

        const formData = new FormData();
        formData.append("title", editPhoto.title);
        formData.append("description", editPhoto.description);
        formData.append("news_id", news_id);

        // Only append file if a new image was selected
        if (editPhoto.file) {
          formData.append("image", editPhoto.file, editPhoto.file.name);
        }

        const { data } = await httpClient.put(
          `/update-photo/${editingPhotoId}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        // Update the photo in the local state
        setPhotos((prev) =>
          prev.map((photo) =>
            photo.id === editingPhotoId
              ? {
                  ...photo,
                  title: editPhoto.title,
                  description: editPhoto.description,
                  image: editPhoto.preview || editPhoto.originalImage,
                  file: editPhoto.file || photo.file,
                }
              : photo
          )
        );

        setEditPhoto({
          preview: null,
          file: null,
          title: "",
          description: "",
          originalImage: "",
        });
        setShowEditPhoto(false);
        setEditingPhotoId(null);
        setErrors({});
        toast.success("Photo updated successfully!");
      } catch (error) {
        console.error("Photo update failed:", error);
        toast.error(error?.response?.data?.message || "Failed to update photo");
      } finally {
        setLoadingStates((prev) => ({ ...prev, updatingPhoto: null }));
      }
    }
  };

  const cancelEditPhoto = () => {
    setEditPhoto({
      preview: null,
      file: null,
      title: "",
      description: "",
      originalImage: "",
    });
    setShowEditPhoto(false);
    setEditingPhotoId(null);
    setErrors({});
  };

  const removePhoto = async (id) => {
    try {
      setLoadingStates((prev) => ({ ...prev, deletingPhoto: id }));

      await httpClient.delete(`/delete-photo/${id}`, {
        data: { news_id },
      });

      setPhotos((prev) => prev.filter((photo) => photo.id !== id));
      toast.success("Photo deleted successfully!");
    } catch (error) {
      console.error("Photo deletion failed:", error);
      toast.error(error?.response?.data?.message || "Failed to delete photo");
    } finally {
      setLoadingStates((prev) => ({ ...prev, deletingPhoto: null }));
    }
  };

  const cancelAddPhoto = () => {
    setNewPhoto({ preview: null, file: null, title: "", description: "" });
    setShowAddPhoto(false);
    setErrors({});
  };
  const validateDraft = () => {
    if (!mainArticle.title.trim()) {
      toast.error("Article title is required to save as draft");
      return false;
    }
    return true;
  };

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

      const { data } = await httpClient.put(
        `/update-gallery-news/${news_id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Draft saved successfully!", { id: "draft-toast" });
      navigate("/dashboard/draft-photo-gallery");
      queryClient.invalidateQueries({
        queryKey: ["gallery-news"],
      });
    } catch (error) {
      console.error("Draft saving error:", error);
      toast.error(error.message || "An error occurred while saving draft.", {
        id: "draft-toast",
      });
    } finally {
      setIsSavingDraft(false);
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
  const handlePublish = async () => {
    if (!validateMainArticle()) {
      return;
    }

    try {
      setLoadingStates((prev) => ({ ...prev, finalUpdate: true }));

      const formData = new FormData();
      formData.append("title", mainArticle.title);
      formData.append("description", mainArticle.description);
      formData.append("location", mainArticle.location);
      formData.append("ref_reporter", mainArticle.ref_reporter);
      formData.append("tags", JSON.stringify(mainArticle.tags)); // Add tags

      const { data } = await httpClient.put(
        `/publish-gallery-news/${news_id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Gallery published successfully!");
      navigate("/dashboard/photo-gallery");
      queryClient.invalidateQueries({
        queryKey: ["gallery-news"],
      });
    } catch (error) {
      console.error("published failed:", error);
      toast.error(error?.response?.data?.message || "Published failed");
    } finally {
      setLoadingStates((prev) => ({ ...prev, finalUpdate: false }));
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

  const removeTag = (tagIndex) => {
    setMainArticle((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, index) => index !== tagIndex),
    }));
  };

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data } = await httpClient(`gallery-news/${news_id}`);
        if (data) {
          setArticle(data);
          setMainArticle({
            title: data?.title,
            description: data.description,
            location: data.location,
            ref_reporter: data.ref_reporter,
            tags: data.tags || [], // Include tags
          });

          const formattedPhotos = data.photos.map((photo) => ({
            id: photo._id,
            title: photo.title,
            description: photo.description,
            image: photo.image,
            file: null,
            preview: photo.image,
          }));

          setPhotos(formattedPhotos);
        }
      } catch (error) {
        toast.error(error?.message || "Failed to Get News");
      }
    };

    if (news_id) {
      fetchNews();
    }
  }, []);

  // Preview Component
  const PreviewComponent = () => (
    <div className="min-h-screen bg-surface-2 p-1 rounded-md">
      <div className="mx-auto">
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

        <div className="max-w-4xl mx-auto">
          <article className="bg-surface rounded-lg shadow-lg overflow-hidden">
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

            <div className="p-6">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <p className="text-fg-muted leading-relaxed whitespace-pre-wrap">
                  {mainArticle.description ||
                    "No article content provided yet."}
                </p>
              </div>
            </div>

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

  if (showPreview) {
    return <PreviewComponent />;
  }

  return (
    <div className="min-h-screen bg-surface-2 p-1 rounded-md">
      <div className="mx-auto">
        <nav className="flex sm:px-3 mb-2 sm:mb-4 sticky -top-2 md:-top-6 z-10 bg-surface w-full p-2 justify-between border">
          <p className="max-md:hidden text-fg line-clamp-1 text-xl sm:md:text-xl lg:text-2xl font-medium leading-7 sm:line-clamp-2 ">
            Update Photo Gallery
          </p>
          <div className="flex gap-1 sm:gap-3 items-center max-sm:justify-between max-sm:w-full">
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
                loadingStates.finalUpdate ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={handlePublish}
              disabled={loadingStates.finalUpdate}
            >
              {loadingStates.finalUpdate ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-surface max-sm:hidden"></div>
                  Publishing...
                </>
              ) : (
                <>
                  <Upload size={20} className="max-sm:hidden" />
                  Publish
                </>
              )}
            </button>

            {article && !article?.published && (
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
            )}
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
              <label className="block text-sm font-medium text-fg-muted mb-2">
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
              placeholder={"Enter reporter..."}
              icon={User}
            />
          </div>
        </div>

        {/* Photo Gallery Section */}
        <div className="mx-auto p-6 bg-surface rounded-lg shadow-lg w-full max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-fg">
                Photo Gallery ({photos.length})
              </h2>
            </div>
            {!showAddPhoto && !showEditPhoto && (
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

              <ImageUploader
                imageFile={newPhoto}
                setImageFile={(newImageData) =>
                  setNewPhoto((prev) => ({
                    ...prev,
                    ...newImageData,
                  }))
                }
                error={errors.image}
              />

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

              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelAddPhoto}
                  className="px-4 py-2 border border-line-strong text-fg-muted rounded-lg hover:bg-surface-2 transition-colors"
                  disabled={loadingStates.addingPhoto}
                >
                  Cancel
                </button>
                <button
                  onClick={addPhoto}
                  className={`px-4 py-2 bg-success hover:bg-success text-paper rounded-lg transition-colors flex items-center gap-2 ${
                    loadingStates.addingPhoto
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={loadingStates.addingPhoto}
                >
                  {loadingStates.addingPhoto ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-surface"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Photo
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Edit Photo Form */}
          {showEditPhoto && (
            <div className="border border-warning/30 rounded-lg p-6 mb-6 bg-warning-soft">
              <h3 className="text-lg font-medium text-fg mb-4 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-warning" />
                Edit Photo
              </h3>

              <ImageUploader
                imageFile={editPhoto}
                setImageFile={setEditPhoto}
                error={errors.image}
              />

              <InputFields
                LabelTitle="Photo Title"
                inputVal={editPhoto.title}
                handleInputValue={(e) =>
                  setEditPhoto((prev) => ({ ...prev, title: e.target.value }))
                }
                name="title"
                placeholder={"Enter photo title..."}
                required={true}
              />
              <TextareaFields
                LabelTitle="Photo Description"
                inputVal={editPhoto.description}
                handleInputValue={(e) =>
                  setEditPhoto((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                name="description"
                placeholder={"Describe this photo..."}
                required={true}
              />

              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelEditPhoto}
                  className="px-4 py-2 border border-line-strong text-fg-muted rounded-lg hover:bg-surface-2 transition-colors"
                  disabled={loadingStates.updatingPhoto === editingPhotoId}
                >
                  Cancel
                </button>
                <button
                  onClick={updatePhoto}
                  className={`px-4 py-2 bg-warning hover:bg-warning text-paper rounded-lg transition-colors flex items-center gap-2 ${
                    loadingStates.updatingPhoto === editingPhotoId
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={loadingStates.updatingPhoto === editingPhotoId}
                >
                  {loadingStates.updatingPhoto === editingPhotoId ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-surface"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-4 h-4" />
                      Update Photo
                    </>
                  )}
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
                  className="bg-surface-2 rounded-lg overflow-hidden group hover:shadow-lg transition-shadow"
                >
                  <div className="relative">
                    <img
                      src={photo.image}
                      alt={photo.title}
                      className="w-full h-48 object-cover"
                    />
                    {/* Action buttons overlay */}
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditPhoto(photo)}
                        className={`p-1.5 bg-warning text-paper rounded-full hover:bg-warning transition-colors shadow-lg ${
                          loadingStates.updatingPhoto === photo.id ||
                          loadingStates.deletingPhoto === photo.id
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        title="Edit photo"
                        disabled={
                          loadingStates.updatingPhoto === photo.id ||
                          loadingStates.deletingPhoto === photo.id
                        }
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removePhoto(photo.id)}
                        className={`p-1.5 bg-danger text-paper rounded-full hover:bg-danger transition-colors shadow-lg ${
                          loadingStates.deletingPhoto === photo.id ||
                          loadingStates.updatingPhoto === photo.id
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        title="Delete photo"
                        disabled={
                          loadingStates.deletingPhoto === photo.id ||
                          loadingStates.updatingPhoto === photo.id
                        }
                      >
                        {loadingStates.deletingPhoto === photo.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-surface"></div>
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {/* Loading overlay for photo operations */}
                    {(loadingStates.updatingPhoto === photo.id ||
                      loadingStates.deletingPhoto === photo.id) && (
                      <div className="absolute inset-0 bg-ink/50 flex items-center justify-center">
                        <div className="bg-surface px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          <span className="text-sm font-medium text-fg">
                            {loadingStates.updatingPhoto === photo.id
                              ? "Updating..."
                              : "Deleting..."}
                          </span>
                        </div>
                      </div>
                    )}
                    {/* Edit indicator */}
                    {editingPhotoId === photo.id &&
                      !loadingStates.updatingPhoto && (
                        <div className="absolute inset-0 bg-warning/20 flex items-center justify-center">
                          <div className="bg-warning text-paper px-3 py-1 rounded-full text-sm font-medium">
                            Editing
                          </div>
                        </div>
                      )}
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

export default UpdateDraftPhotoGallery;
