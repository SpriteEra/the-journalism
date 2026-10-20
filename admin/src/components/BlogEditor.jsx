import { normalizeBlog } from "./taxonomy/TaxonomyFields.jsx";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EditorJS from "@editorjs/editorjs";
import imageCompression from "browser-image-compression";

import { ArrowRight, RotateCcw, Upload } from "lucide-react";
import { tools } from "../utils/EditorTools.jsx";
import { EditorContext } from "../pages/news/CreateNews.jsx";
import { truncate } from "../utils/utils.js";
import toast from "react-hot-toast";
import InputFields from "../utils/InputFields.jsx";
import { useQueryClient } from "@tanstack/react-query";
import httpClient from "../api/httpClient.js";
import { useSelector } from "react-redux";
import { handleImageError } from "../utils/imageError.js";
const Todaydate = new Date().toISOString().split("T")[0];

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result); // this is the base64 string
    reader.onerror = (error) => reject(error);
  });
};

function base64ToFile(base64String, fileName) {
  const arr = base64String.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], fileName, { type: mime });
}

const BlogEditor = () => {
  const navigate = useNavigate();
  let { news_id } = useParams();
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.user);

  const query = new URLSearchParams(window.location.search);
  const mode = query.get("mode");
  const page = query.get("page");
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [showVideo, setShowVideo] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const handleVideoChange = async (e) => {
    const file = e.target.files[0];

    if (file) {
      const maxSize = 100 * 1024 * 1024; // 100MB in bytes

      if (file.size > maxSize) {
        toast.error("File size exceeds 100MB limit. Please compress it.");
        return;
      }

      setVideoFile(file);

      const videoUrl = URL.createObjectURL(file);
      setVideoPreview(videoUrl);
    }
  };

  const handleUpload = async () => {
    try {
      if (video) {
        // implement delete here if needed
      }

      if (!videoFile) {
        toast.error("Please select a video file first.");
        return;
      }

      setIsUploading(true);
      const loadingToast = toast.loading("Video Uploading and comp...");

      const formData = new FormData();
      formData.append("file", videoFile);

      const response = await fetch(
        `${import.meta.env.VITE_IMAGE_SERVER_DOMAIN}/api/v1/upload-stream`,
        {
          method: "POST",
          body: formData,
        }
      );

      toast.dismiss(loadingToast);

      if (!response.ok) {
        const errorText = await response.text();
        toast.error(`Upload failed: ${errorText}`);
        setIsUploading(false);
        return;
      }

      const data = await response.json();

      if (data?.success) {
        setVideoFile(null);
        setIsUploading(false);
        setVideoPreview(data?.url);
        const updatedBlog = { ...blog, video: data?.url };
        setHasChanges(true);
        setBlog(updatedBlog);
        toast.success("Video uploaded successfully!");
      } else {
        toast.error(data?.message || "Upload failed");
        setIsUploading(false);
      }
    } catch (error) {
      toast.dismiss();
      console.error("Upload Error:", error);
      toast.error(
        error?.message || "An unexpected error occurred while uploading."
      );
      setIsUploading(false);
    }
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    const updatedBlog = { ...blog, video: "" };
    setHasChanges(true);
    setBlog(updatedBlog);
    // Clear the file input
    document.getElementById("uploadVideo").value = "";
  };

  let {
    blog,
    blog: {
      banner,
      title,
      tags,
      ref_reporter,
      description,
      content,
      category,
      subCategory,
      state,
      district,
      location,
      breaking_news,
      sendNotification,
      imageRef,
      video,
      isVideo,
      is_literature,
    },
    setBlog,
    textEditor,
    setTextEditor,
    setEditorState,
    hasChanges,

    setHasChanges,
  } = useContext(EditorContext);

  const handleToggleVideo = () => {
    setShowVideo(!showVideo);
    const updatedBlog = { ...blog, isVideo: !isVideo };
    // Optional: Clear video when hiding the section
    setBlog(updatedBlog);
    localStorage.setItem("blog", JSON.stringify(updatedBlog));
    setHasChanges(true);
    if (showVideo && videoFile) {
      handleRemoveVideo();
    }
  };
  useEffect(() => {
    if (blog) {
      setVideoPreview(blog.video);
    }
    const savedBlog = JSON.parse(localStorage.getItem("blog"));
    if (savedBlog) {
      // Convert base64 back to File if it exists
      if (savedBlog.banner?.base64) {
        const file = base64ToFile(
          savedBlog.banner.base64,
          savedBlog.banner.name,
          savedBlog.banner.type
        );
        savedBlog.banner.file = file;
      }
      setBlog(normalizeBlog(savedBlog));
      if (savedBlog?.video) {
        setVideoPreview(savedBlog?.video);
      }
    }

    if (!textEditor.isReady) {
      setTextEditor(
        new EditorJS({
          holderId: "textEditor",
          data: savedBlog
            ? savedBlog.content
            : Array.isArray(content)
            ? content[0]
            : content,
          tools: tools,
          placeholder: "Let's write an awesome news",
          onChange: () => setHasChanges(true),
        })
      );
    }
  }, []);

  useEffect(() => {
    const autoSave = () => {
      if (textEditor.isReady && hasChanges) {
        textEditor.save().then((data) => {
          const updatedBlog = { ...blog, content: data };
          setBlog(updatedBlog);
          localStorage.setItem("blog", JSON.stringify(updatedBlog));

          // Send auto-save request to server
          // axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/create-news", {
          //   ...updatedBlog,
          //   id: news_id,
          //   draft: true,
          // });

          // Reset hasChanges to false after saving
          setHasChanges(false);
        });
      }
    };

    const intervalId = setInterval(autoSave, 5000);

    return () => clearInterval(intervalId);
  }, [textEditor, blog, news_id, setBlog, hasChanges, page]);

  const handleChangeBanner = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };

      try {
        const compressedFile = await imageCompression(file, options);

        // Convert to base64
        const base64String = await fileToBase64(compressedFile);

        const updatedBlog = { ...blog, banner: base64String };
        setBlog(updatedBlog);
        localStorage.setItem("blog", JSON.stringify(updatedBlog));
        setHasChanges(true);
      } catch (error) {
        console.error("Image compression or conversion failed:", error);
      }
    }
    // if (e.target.files[0]) {
    //   let loadingToast = toast.loading("Uploading...");
    //   uploadImage(e.target.files[0])
    //     .then((url) => {
    //       toast.dismiss(loadingToast);
    //       toast.success("Uploaded Successfully");

    //       const updatedBlog = { ...blog, banner: url };
    //       setBlog(updatedBlog);
    //       localStorage.setItem("blog", JSON.stringify(updatedBlog));
    //       setHasChanges(true);
    //     })
    //     .catch((err) => {
    //       toast.dismiss(loadingToast);
    //       toast.error(err);
    //     });
    // }
  };

  const handleTitleKeyDown = (e) => {
    if (e.keyCode === 13) e.preventDefault();
  };

  const handleTitleChange = (e) => {
    let input = e.target;
    input.style.height = "auto";
    input.style.height = input.scrollHeight + "px";
    const updatedBlog = { ...blog, title: input.value };
    setBlog(updatedBlog);
    localStorage.setItem("blog", JSON.stringify(updatedBlog));
    setHasChanges(true);
  };
  const handleImageCaptionChange = (e) => {
    let input = e.target;
    const updatedBlog = { ...blog, imageRef: input.value };
    setBlog(updatedBlog);
    localStorage.setItem("blog", JSON.stringify(updatedBlog));
    setHasChanges(true);
  };

  const handlePublishEvent = () => {
    if (!banner) {
      return toast.error("Upload a news banner to publish it");
    }
    if (!title.length) return toast.error("Write news title to publish it");
    if (isVideo && !video.length) return toast.error("Please Upload a video");
    if (textEditor.isReady) {
      textEditor
        .save()
        .then((data) => {
          if (data.blocks.length) {
            const updatedBlog = { ...blog, content: data };
            setBlog(updatedBlog);
            const queryParams = new URLSearchParams(window.location.search);
            queryParams.set("page", "publish");
            const newUrl = `${
              window.location.pathname
            }?${queryParams.toString()}`;
            window.history.replaceState(null, "", newUrl);
            setEditorState("publish");
            localStorage.setItem("blog", JSON.stringify(updatedBlog));
          } else {
            return toast.error("Write Something in your news to publish it");
          }
        })
        .catch((err) => {
          toast.error(err);
        });
    }
  };

  const handleSaveDraft = (e) => {
    if (e.target.className.includes("disable")) {
      return;
    }
    if (!title.length) {
      return toast.error("Write News Title before saving it as draft");
    }

    let loadingToast = toast.loading("Saving Draft...");
    e.target.classList.add("disable");

    if (textEditor && textEditor.isReady) {
      textEditor.save().then((content) => {
        const formData = new FormData();
        formData.append("title", title);
        if (banner?.startsWith("data:image")) {
          const bannerFile = base64ToFile(banner, "banner.jpg");
          formData.append("banner", bannerFile);
        } else {
          formData.append("banner", banner); // Image file
        }
        formData.append("ref_reporter", ref_reporter);
        formData.append("is_literature", is_literature);

        formData.append("video", video); // Image file
        formData.append("imageRef", imageRef); // Image file
        formData.append("isVideo", isVideo); // Image file
        formData.append("description", description);
        formData.append("content", JSON.stringify(content));
        formData.append("tags", JSON.stringify(tags)); // Array as JSON string
        formData.append("category", JSON.stringify(category || []));
        formData.append("subCategory", JSON.stringify(subCategory || []));
        formData.append("state", JSON.stringify(state || []));
        formData.append("district", JSON.stringify(district || []));
        formData.append("location", location);
        formData.append("breaking_news", breaking_news);
        formData.append("sendNotification", sendNotification);
        formData.append("draft", "true");
        formData.append("id", news_id);

        httpClient
          .post("create-news", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          })
          .then(() => {
            e.target.classList.remove("disable");
            toast.dismiss(loadingToast);
            toast.success("Saved as Draft successfully");
            localStorage.removeItem("blog");
            navigate("/dashboard/news");
            queryClient.invalidateQueries({
              queryKey: ["news"], // Will match all with prefix ['event-news', ...]
            });
          })
          .catch(({ response }) => {
            e.target.classList.remove("disable");
            toast.dismiss(loadingToast);
            toast.error(response?.data?.error || "Failed to publish");
          });
      });
    }
  };

  const handleResetEditor = (e) => {
    e.preventDefault();
    localStorage.removeItem("blog");
    window.location.reload();
  };

  return (
    <div className="mx-auto p-0 sm:p-3 bg-surface rounded-md">
      <nav className="flex sm:px-3 mb-2 sm:mb-4 sticky -top-2 md:-top-6 z-10 bg-surface w-full p-2 justify-between">
        <p className="max-md:hidden text-fg line-clamp-1 text-xl sm:md:text-xl lg:text-2xl font-medium leading-7 sm:line-clamp-2 ">
          {title?.length ? truncate(title, 60) : "New News"}
        </p>
        <div className="flex gap-1 sm:gap-3 items-center max-sm:justify-between max-sm:w-full">
          {/* Video Toggle Button */}
          {user?.role === "admin" && (
            <div className="flex items-center sm:gap-2 ">
              <span className="text-sm text-fg-muted max-sm:hidden">
                Video
              </span>
              <button
                onClick={handleToggleVideo}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  isVideo
                    ? "bg-primary hover:bg-primary-hover"
                    : "bg-surface-3 hover:bg-line-strong"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-surface transition-transform duration-200 ${
                    isVideo ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          )}
          <div className="h-6 w-px bg-surface-3"></div>
          <button
            className="btn-blue bg-gradient-to-r max-sm:text-sm from-success to-success border-success flex items-center sm:gap-1 h-full"
            onClick={handlePublishEvent}
          >
            <ArrowRight size={20} className="max-sm:hidden" />
            Next
          </button>
          {mode !== "edit" && (
            <button
              className="btn-blue-outline bg-surface hover:bg-surface-2 text-fg-muted border border-line-strong flex gap-1 items-center max-sm:text-sm"
              onClick={handleSaveDraft}
            >
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
            </button>
          )}
          <button
            className="btn-red flex items-center gap-1 h-full max-sm:text-sm"
            onClick={handleResetEditor}
          >
            <RotateCcw size={20} className="max-sm:hidden" />
            Reset
          </button>
        </div>
      </nav>
      <section>
        <div className="mx-auto max-w-[800px] w-full p-1 sm:p-3">
          <div className="bg-surface rounded-xl sm:rounded-2xl shadow-xl sm:shadow-xl border border-line/50 p-1 sm:p-3 mb-8 backdrop-blur-sm">
            <div className="relative group">
              <div className="aspect-video bg-gradient-to-br from-surface-2 to-surface-2 rounded-xl overflow-hidden border-2 border-dashed border-line-strong hover:border-primary transition-all duration-300">
                <label
                  htmlFor="uploadBanner"
                  className="cursor-pointer block h-full"
                >
                  <img
                    src={banner || "/news-banner.png"}
                    alt="Article Banner"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={handleImageError}
                  />
                  <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/10 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-surface/90 backdrop-blur-sm rounded-xl p-2 sm:px-4 sm:py-2">
                      <span className="text-sm font-medium text-fg-muted flex items-center space-x-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>Change Image</span>
                      </span>
                    </div>
                  </div>
                </label>
                <input
                  type="file"
                  id="uploadBanner"
                  accept=".png, .jpg, .jpeg, .webp"
                  hidden
                  onChange={handleChangeBanner}
                />
              </div>
            </div>
            <div className="mt-2 sm:mt-5">
              <InputFields
                LabelTitle={"Image Caption"}
                placeholder={"Add a caption for your image..."}
                inputVal={imageRef}
                name={"imageRef"}
                handleInputValue={handleImageCaptionChange}
              />
            </div>
          </div>

          <div className="bg-surface rounded-xl sm:rounded-2xl shadow-xl sm:shadow-xl border border-line/50 p-1 sm:p-3 mb-8">
            <textarea
              defaultValue={title}
              placeholder="News Title"
              className="text-xl sm:text-2xl font-medium w-full h-20 bg-transparent border-none outline-none resize-none text-fg placeholder-fg-faint leading-tight"
              onKeyDown={handleTitleKeyDown}
              onChange={handleTitleChange}
            />
          </div>
          <hr className="w-full opacity-10 my-5" />

          {/* Video Input Section - Only show when toggle is enabled */}
          {isVideo && (
            <div className="w-full mb-6">
              <div className="flex items-center gap-2 mb-3">
                <svg
                  className="w-5 h-5 text-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM5 8a1 1 0 011-1h1a1 1 0 010 2H6a1 1 0 01-1-1zm6 1a1 1 0 100 2h3a1 1 0 100-2H11z" />
                </svg>
                <h3 className="text-lg font-semibold text-fg">
                  Video Content
                </h3>
              </div>

              <div className="bg-surface rounded-xl sm:rounded-2xl shadow-xl sm:shadow-xl border border-line/50 p-1 sm:p-3 mb-8 transform transition-all duration-500 animate-in slide-in-from-top-4">
                {!videoPreview ? (
                  <div className="relative group">
                    <label
                      htmlFor="uploadVideo"
                      className="cursor-pointer block"
                    >
                      <div className="border-2 border-dashed border-primary rounded-xl p-8 text-center hover:border-primary transition-all duration-300 group-hover:bg-primary-soft">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="w-16 h-16 bg-primary-soft rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <svg
                              className="w-8 h-8 text-primary"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-lg font-medium text-fg-muted mb-1">
                              Upload Your Video
                            </p>
                            <p className="text-sm text-fg-subtle">
                              Drag and drop your video file here, or click to
                              browse
                            </p>
                            <p className="text-xs text-fg-faint mt-2">
                              Supports MP4, MOV, AVI, WEBM • Max size: 100MB
                            </p>
                          </div>
                        </div>
                      </div>
                    </label>
                    <input
                      id="uploadVideo"
                      type="file"
                      accept=".mp4, .mov, .avi, .webm"
                      hidden
                      onChange={handleVideoChange}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden shadow-lg border">
                      <video
                        controls
                        className="w-full max-h-[350px] object-contain bg-ink"
                        src={videoPreview}
                      >
                        Your browser does not support the video tag.
                      </video>
                      <div className="absolute top-3 right-3">
                        <button
                          className="bg-danger hover:bg-danger text-paper p-2 rounded-full transition-all duration-200 shadow-lg hover:scale-110"
                          onClick={handleRemoveVideo}
                          title="Remove Video"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-success-soft border border-success/30 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-success-soft rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-success"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-success">
                            Video Details
                          </p>
                          <p className="text-xs text-success">
                            {truncate(videoFile?.name, 20)}
                          </p>
                        </div>
                      </div>
                      {isUploading ? (
                        <div className="flex items-center gap-2 bg-primary-soft text-primary border border-primary rounded-md px-2 py-1 max-sm:text-sm">
                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                          <span>Uploading...</span>
                        </div>
                      ) : videoFile ? (
                        <button
                          className="bg-success-soft text-success border border-success rounded-md px-2 py-1 max-sm:text-sm cursor-pointer"
                          onClick={handleUpload}
                        >
                          Upload
                        </button>
                      ) : (
                        <div className="bg-surface-2 text-fg-muted border border-fg-faint rounded-md px-2 py-1 max-sm:text-sm">
                          Video uploaded
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* <div id="textEditor" className="font-anekdevanagari"></div> */}
          <div className="bg-surface rounded-xl sm:rounded-2xl shadow-xl sm:shadow-xl border border-line/50 p-1 sm:p-3">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-5 h-5 text-paper"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2.5 2.5 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-fg">
                  Article Content
                </h3>
                <p className="text-sm text-fg-subtle">
                  Write your news with our rich text editor
                </p>
              </div>
            </div>

            <div
              id="textEditor"
              className="min-h-[400px] font-anekdevanagari text-fg border border-line rounded-xl p-2 sm:p-6 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all duration-200 bg-surface-2/30"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogEditor;
