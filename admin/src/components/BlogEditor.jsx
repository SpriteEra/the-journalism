import { normalizeBlog } from "./taxonomy/TaxonomyFields.jsx";
import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EditorJS from "@editorjs/editorjs";
import imageCompression from "browser-image-compression";
// @ts-ignore
import Undo from "editorjs-undo";
import {
  ArrowRight,
  RotateCcw,
  Undo2,
  Redo2,
  CheckCircle2,
  Circle,
  Lightbulb,
} from "lucide-react";
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
  const undoRef = useRef(null);

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
      const initialData = savedBlog
        ? savedBlog.content
        : Array.isArray(content)
          ? content[0]
          : content;

      const editor = new EditorJS({
        holderId: "textEditor",
        data: initialData,
        tools: tools,
        placeholder: "Let's write an awesome news",
        onChange: () => setHasChanges(true),
        onReady: () => {
          const undo = new Undo({
            editor,
            config: {
              debounceTimer: 200,
              shortcuts: { undo: "CMD+Z", redo: "CMD+Y" }, // change shortcuts here
            },
          });
          if (initialData?.blocks) undo.initialize(initialData);
          undoRef.current = undo;

          // extra shortcut: Ctrl+Shift+Z also redoes
          const holder = document.getElementById("textEditor");
          holder?.addEventListener("keydown", (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z") {
              e.preventDefault();
              undo.redo();
            }
          });
        },
      });

      setTextEditor(editor);
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

  useEffect(() => {
    const holder = document.getElementById("textEditor");
    if (!holder || !textEditor?.isReady) return;

    const onPaste = (e) => {
      const text = e.clipboardData?.getData("text/plain") || "";
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.replace(/^\s*(?:[-*•]|\[[ xX]?\])\s*/, "").trim()) // strip "- ", "* ", "[ ] "
        .filter(Boolean);

      if (lines.length < 2) return; // single line: let Editor.js paste normally

      const index = textEditor.blocks.getCurrentBlockIndex();
      const current = textEditor.blocks.getBlockByIndex(index);
      if (current?.name !== "checklist") return;

      // must be called synchronously, before any await
      e.preventDefault();
      e.stopPropagation();

      current.save().then((saved) => {
        const existing = (saved?.data?.items || []).filter((i) => i.text?.trim());
        const added = lines.map((t) => ({ text: t, checked: false }));
        textEditor.blocks.insert(
          "checklist",
          { items: [...existing, ...added] },
          undefined,
          index,
          true, // focus
          true  // replace the current block
        );
        setHasChanges(true);
      });
    };

    // capture phase so it runs before Editor.js's own paste handler
    holder.addEventListener("paste", onPaste, true);
    return () => holder.removeEventListener("paste", onPaste, true);
  }, [textEditor]);

  useEffect(() => {
    const holder = document.getElementById("textEditor");
    if (!holder) return;

    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        // only take over when focus is inside the editor
        if (!holder.contains(document.activeElement)) return;
        e.preventDefault();
        e.stopPropagation();
        const range = document.createRange();
        range.selectNodeContents(holder);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    };

    // capture phase so it runs before Editor.js's own handler
    holder.addEventListener("keydown", onKeyDown, true);
    return () => holder.removeEventListener("keydown", onKeyDown, true);
  }, []);

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
            const newUrl = `${window.location.pathname
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
            navigate("/dashboard/draft-news");
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

  // ---- UI-only helpers (no API / handler changes) ----
  const TITLE_IDEAL_MAX = 100;
  const titleLength = title?.length || 0;
  const hasContent = !!content?.blocks?.length;
  const videoPending = !!videoFile && !isUploading;

  const checklist = [
    { label: "Banner image", done: !!banner },
    { label: "News title", done: titleLength > 0 },
    { label: "Article content", done: hasContent },
    ...(isVideo
      ? [{ label: "Video uploaded", done: !!video?.length && !videoPending }]
      : []),
  ];
  const doneCount = checklist.filter((c) => c.done).length;

  const Toggle = (
    <button
      type="button"
      onClick={handleToggleVideo}
      aria-pressed={!!isVideo}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${isVideo
        ? "bg-primary hover:bg-primary-hover"
        : "bg-surface-3 hover:bg-line-strong"
        }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-surface transition-transform duration-200 ${isVideo ? "translate-x-6" : "translate-x-1"
          }`}
      />
    </button>
  );

  return (
    <div className="mx-auto w-full p-0 sm:p-3 sm:bg-surface rounded-md">
      {/* TOP BAR: title always; buttons only on mobile/tablet (desktop buttons live in the right panel) */}
      <nav className="flex sm:px-3 mb-1 sm:mb-4 sticky top-15 md:top-15 shadow-card z-10  w-full p-2 justify-end md:justify-between bg-surface">
        <p className="max-md:hidden text-fg line-clamp-1 text-xl sm:md:text-xl lg:text-2xl font-medium leading-7 sm:line-clamp-2 ">
          {title?.length ? truncate(title, 60) : "New News"}
        </p>
        <div className="flex gap-1 sm:gap-3 items-center lg:hidden">
          {/* Video Toggle Button */}
          {user?.role === "admin" && (
            <div className="flex items-center sm:gap-2 ">
              <span className="text-sm text-fg-muted max-sm:hidden">
                Video
              </span>
              {Toggle}
            </div>
          )}

          <div className="h-6 w-px bg-surface-3"></div>
          <button
            className="btn-blue max-sm:rounded bg-gradient-to-r max-sm:text-sm from-success to-success border-success flex items-center sm:gap-1 h-full"
            onClick={handlePublishEvent}
          >
            <ArrowRight size={20} className="max-sm:hidden" />
            Next
          </button>
          {mode !== "edit" && (
            <button
              className="btn-blue-outline max-sm:rounded bg-surface hover:bg-surface-2 text-fg-muted border border-line-strong flex gap-1 items-center max-sm:text-sm"
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
            className="btn-red max-sm:rounded flex items-center gap-1 h-full max-sm:text-sm"
            onClick={handleResetEditor}
          >
            <RotateCcw size={20} className="max-sm:hidden" />
            Reset
          </button>
        </div>
      </nav>

      <section>
        {/*
          Mobile: single column  -> banner, title, video, editor (same as before)
          Desktop (lg+): left = banner/title/editor, right = sticky panel (actions + video + tips)
        */}
        <div className="w-full sm:p-3 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-x-6">
          {/* ---------- LEFT: banner ---------- */}
          <div className="lg:col-start-1 lg:row-start-1">
            <div className="bg-surface rounded-lg sm:rounded-2xl shadow-card border border-line/50 p-1 sm:p-3 mb-3 sm:mb-8 backdrop-blur-sm">
              <div className="relative group">
                <div className="aspect-video bg-gradient-to-br from-surface-2 to-surface-2 rounded-lg sm:rounded-xl overflow-hidden border-2 border-dashed border-line-strong hover:border-primary transition-all duration-300">
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
              <p className="mt-2 text-xs text-fg-subtle max-sm:hidden">
                Use a clear 16:9 landscape photo. PNG, JPG or WEBP – it is
                compressed automatically.
              </p>
              <div className="mt-2 sm:mt-4">
                <InputFields
                  LabelTitle={"Image Caption"}
                  placeholder={"Add a caption for your image..."}
                  inputVal={imageRef}
                  name={"imageRef"}
                  handleInputValue={handleImageCaptionChange}
                />
              </div>
            </div>
          </div>

          {/* ---------- LEFT: title ---------- */}
          <div className="lg:col-start-1 lg:row-start-2">
            <div className="bg-surface rounded-lg sm:rounded-2xl shadow-card border border-line/50 p-1.5 sm:p-3 mb-2 sm:mb-8">
              <textarea
                defaultValue={title}
                placeholder="News Title"
                className="text-xl sm:text-2xl font-semibold w-full h-20 bg-transparent border-none outline-none resize-none text-fg placeholder-fg-faint leading-tight"
                onKeyDown={handleTitleKeyDown}
                onChange={handleTitleChange}
              />
              <div className="flex items-center justify-between px-1 pb-1 text-xs max-sm:hidden">
                <span className="text-fg-subtle">
                  Short, specific headlines work best.
                </span>
                <span
                  className={
                    titleLength > TITLE_IDEAL_MAX ? "text-danger" : "text-fg-subtle"
                  }
                >
                  {titleLength}/{TITLE_IDEAL_MAX}
                </span>
              </div>
            </div>
            <hr className="w-full opacity-10 my-2 sm:my-5 max-sm:hidden lg:hidden" />
          </div>

          {/* ---------- RIGHT (desktop) / inline (mobile): actions + video + tips ---------- */}
          <aside className="lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:self-start lg:sticky lg:top-32 lg:space-y-4">
            {/* Desktop action panel */}
            <div className="hidden lg:block bg-surface rounded-2xl shadow-card border border-line/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-fg">Actions</h3>
                <span className="text-xs text-fg-subtle">
                  {hasChanges ? "Saving locally…" : "Draft saved locally"}
                </span>
              </div>

              {user?.role === "admin" && (
                <div className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 mb-3">
                  <div>
                    <p className="text-sm font-medium text-fg">Video news</p>
                    <p className="text-xs text-fg-subtle">
                      Turn on to attach a video to this story
                    </p>
                  </div>
                  {Toggle}
                </div>
              )}

              <div className="flex flex-col gap-2 shadow-card">
                <button
                  className="btn-blue lg:py-2 bg-gradient-to-r from-success to-success border-success flex items-center justify-center gap-1 w-full"
                  onClick={handlePublishEvent}
                >
                  <ArrowRight size={20} />
                  Next
                </button>
                {mode !== "edit" && (
                  <button
                    className="btn-blue-outline lg:py-2 bg-surface hover:bg-surface-2 text-fg-muted border border-line-strong flex gap-1 items-center justify-center w-full"
                    onClick={handleSaveDraft}
                  >
                    <span className="flex items-center">
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
                  className="btn-red lg:py-2 flex items-center justify-center gap-1 w-full"
                  onClick={handleResetEditor}
                >
                  <RotateCcw size={20} />
                  Reset
                </button>
              </div>
            </div>


            {/* Video Input Section - Only show when toggle is enabled */}
            {isVideo && (
              <div className="w-full mb-2 sm:mb-6 mt-5 lg:mt-0 lg:mb-0">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
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

                <div className="bg-surface rounded-xl sm:rounded-2xl shadow-card sm:shadow-card border border-line/50 p-1 sm:p-3 mb-8 lg:mb-0 transform transition-all duration-500 animate-in slide-in-from-top-4">
                  {!videoPreview ? (
                    <div className="relative group">
                      <label
                        htmlFor="uploadVideo"
                        className="cursor-pointer block"
                      >
                        <div className="border-2 border-dashed border-primary rounded-xl p-8 lg:p-6 text-center hover:border-primary transition-all duration-300 group-hover:bg-primary-soft">
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
                              <p className="text-xs text-fg-subtle">
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
                    <div className="space-y-2 sm:space-y-4">
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
                        <div className="flex items-center gap-1 sm:gap-3">
                          <div className="size-6 sm:size-8 bg-success-soft rounded-full flex items-center justify-center">
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

                      {videoPending && (
                        <p className="text-xs text-primary px-1">
                          Selected, not uploaded yet. Press “Upload” so the
                          video is saved with your news.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Desktop readiness checklist */}
            <div className="hidden lg:block bg-surface rounded-2xl shadow-card border border-line/50 p-4 mt-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-fg">
                  Ready to continue?
                </h3>
                <span className="text-xs text-fg-subtle">
                  {doneCount}/{checklist.length}
                </span>
              </div>
              <ul className="space-y-1.5">
                {checklist.map((item) => (
                  <li
                    key={item.label}
                    className={`flex items-center gap-2 text-sm ${item.done ? "text-success" : "text-fg-muted"
                      }`}
                  >
                    {item.done ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <Circle size={16} />
                    )}
                    {item.label}
                  </li>
                ))}
              </ul>
              {videoPending && (
                <p className="mt-2 text-xs text-primary">
                  You picked a video – press “Upload” below before continuing.
                </p>
              )}
            </div>

            {/* Desktop tips */}
            <div className="hidden lg:block rounded-2xl border border-line/50 bg-surface-2/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={16} className="text-primary" />
                <h3 className="text-sm font-semibold text-fg">Writing tips</h3>
              </div>
              <ul className="space-y-1.5 text-xs text-fg-muted list-disc pl-4">
                <li>Your work is auto-saved in this browser every few seconds.</li>
                <li>
                  Undo / Redo: <b>Ctrl+Z</b>, <b>Ctrl+Y</b> or{" "}
                  <b>Ctrl+Shift+Z</b> (⌘ on Mac).
                </li>

                <li>
                  Lead with the key fact in the first paragraph, then add
                  details.
                </li>
                <li>
                  <b>Reset</b> clears the local draft, so use <b>Save Draft</b>{" "}
                  first if you want to keep it.
                </li>
              </ul>
            </div>
          </aside>

          {/* ---------- LEFT: editor ---------- */}
          <div className="lg:col-start-1 lg:row-start-3 bg-surface rounded-xl sm:rounded-2xl shadow-card border border-line/50 p-1 sm:p-3 max-sm:mt-4 lg:mt-0">
            <div className="flex items-center justify-between space-x-3 mb-2 sm:mb-6">
              <div className="flex items-center gap-2 md:gap-3 max-sm:px-1">
                <div className="size-8 sm:size-10 bg-gradient-to-br from-primary to-primary rounded-md sm:rounded-lg flex items-center justify-center shadow-lg">
                  <svg
                    className="size-4 sm:size-5 text-paper"
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
                  <p className="text-[10px] sm:text-sm text-fg-subtle -mt-1">
                    Write your news with our rich text editor
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  title="Undo (Ctrl+Z)"
                  onClick={() => undoRef.current?.undo()}
                  className="p-1.5 rounded text-fg-muted hover:bg-surface-2"
                >
                  <Undo2 size={18} />
                </button>
                <button
                  type="button"
                  title="Redo (Ctrl+Y)"
                  onClick={() => undoRef.current?.redo()}
                  className="p-1.5 rounded text-fg-muted hover:bg-surface-2"
                >
                  <Redo2 size={18} />
                </button>
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