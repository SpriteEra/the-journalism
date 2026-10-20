import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { truncate } from "../../utils/utils";
import imageCompression from "browser-image-compression";
import httpClient from "../../api/httpClient.js";
import { useFetchEventNews } from "../../hooks/news.js";
import { useQueryClient } from "@tanstack/react-query";
import { useFetchActiveEvent } from "../../hooks/event.js";
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
const blogStructure = {
  title: "",
  banner: null,
  description: "",
};

let charLength = 500;

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result); // this is the base64 string
    reader.onerror = (error) => reject(error);
  });
};

const CreateEventNews = () => {
  let { news_id } = useParams();

  const [blog, setBlog] = useState(blogStructure);
  const [hasChanges, setHasChanges] = useState(false);
  const { data: activeEvent } = useFetchActiveEvent();
  const [loading, setLoading] = useState(true);

  const { title, banner, description } = blog;

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const handlePublishEvent = (e) => {
    if (e.target.className.includes("disable")) return;
    if (!banner?.length)
      return toast.error("Upload a news banner to publish it");
    if (!title?.length) return toast.error("Write news title to publish it");

    // Convert base64 banner to file
    const bannerFile = base64ToFile(banner, "banner.jpg");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("banner", bannerFile);
    formData.append("description", description);
    formData.append("event_cateogry", activeEvent?._id);
    // formData.append("id", news_id);
    formData.append("draft", true);

    e.target.classList.add("disable");
    const loadingToast = toast.loading("Publishing Event News...");

    httpClient
      .post("/create-event-news", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(() => {
        e.target.classList.remove("disable");
        toast.dismiss(loadingToast);
        toast.success("Published successfully");
        localStorage.removeItem("event-blog");
        queryClient.invalidateQueries({
          queryKey: ["event-news"], // Will match all with prefix ['event-news', ...]
        });
        navigate("/dashboard/events");
      })
      .catch(({ response }) => {
        e.target.classList.remove("disable");
        toast.dismiss(loadingToast);
        toast.error(response?.data?.error || "Failed to publish");
      });
  };

  //   const handleSaveDraft = (e) => {
  //     if (e.target.className.includes("disable")) {
  //       return;
  //     }
  //     if (!title.length) {
  //       return toast.error("Write News Title before saving it as draft");
  //     }

  //     let loadingToast = toast.loading("Saving Draft...");
  //     e.target.classList.add("disable");
  //     let blogObj = {
  //       title,
  //       banner,
  //       description,
  //       draft: true,
  //       event_type: "republic-day",
  //     };

  //     axios
  //       .post(import.meta.env.VITE_SERVER_DOMAIN + "/create-event-news", {
  //         ...blogObj,
  //         id: news_id,
  //       })
  //       .then(() => {
  //         e.target.classList.remove("disable");
  //         toast.dismiss(loadingToast);
  //         toast.success("Saved successfully");
  //         localStorage.removeItem("event-blog");
  //         navigate("/dashboard");
  //       })
  //       .catch(({ response }) => {
  //         e.target.classList.remove("disable");
  //         toast.dismiss(loadingToast);
  //         return toast.error(response.data.error);
  //       });
  //   };

  const handleError = (e) => {
    let img = e.target;
    img.src = "/news-banner.png";
  };
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
        localStorage.setItem("event-blog", JSON.stringify(updatedBlog));
        setHasChanges(true);
      } catch (error) {
        console.error("Image compression or conversion failed:", error);
      }
    }
  };

  //   const handleChangeBanner = (e) => {
  //     if (e.target.files[0]) {
  //       let loadingToast = toast.loading("Uploading...");
  //       uploadImage(e.target.files[0])
  //         .then((url) => {
  //           toast.dismiss(loadingToast);
  //           toast.success("Uploaded Successfully");

  //           const updatedBlog = { ...blog, banner: url };
  //           setBlog(updatedBlog);
  //           localStorage.setItem("event-blog", JSON.stringify(updatedBlog));
  //           setHasChanges(true);
  //         })
  //         .catch((err) => {
  //           toast.dismiss(loadingToast);
  //           toast.error(err);
  //         });
  //     }
  //   };

  const handleTitleKeyDown = (e) => {
    if (e.keyCode === 13) e.preventDefault();
  };

  const handleTitleChange = (e) => {
    let input = e.target;
    input.style.height = "auto";
    input.style.height = input.scrollHeight + "px";
    const updatedBlog = { ...blog, title: input.value };
    setBlog(updatedBlog);
    localStorage.setItem("event-blog", JSON.stringify(updatedBlog));
    setHasChanges(true);
  };
  const handleChangeDescription = (e) => {
    const updatedBlog = { ...blog, description: e.target.value };
    setBlog(updatedBlog);
    localStorage.setItem("event-blog", JSON.stringify(updatedBlog));
    setHasChanges(true);
  };

  useEffect(() => {
    if (!news_id) {
      return setLoading(false);
    }
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/get-event-news", {
        news_id,
        mode: "edit",
      })
      .then(({ data: { news } }) => {
        setBlog(news);
        setLoading(false);
      })
      .catch((err) => {
        setBlog(null);
        setLoading(false);
        console.log(err);
      });
  }, [news_id]);

  const handleResetEditor = (e) => {
    e.preventDefault();
    localStorage.removeItem("blog");
    setBlog(blogStructure);
    setHasChanges(false);
    setEditorState("editor");
    navigate("/dashboard");
  };

  useEffect(() => {
    const savedBlog = JSON.parse(localStorage.getItem("event-blog"));
    if (savedBlog) {
      setBlog(savedBlog);
    }
  }, []);
  return (
    <div className="mx-auto p-3 bg-surface rounded-md">
      <nav className="flex px-3 mb-4 sticky -top-2 sm:-top-6 z-10 bg-surface w-full p-2 justify-between">
        <p className="max-md:hidden text-fg line-clamp-1 text-xl sm:md:text-xl lg:text-2xl font-medium leading-7 sm:line-clamp-2 ">
          {title?.length ? truncate(title, 60) : "Event News"}
        </p>
        <div className="flex gap-3">
          <button className="btn-blue" onClick={handlePublishEvent}>
            Publish
          </button>
          <button className="btn-red" onClick={handleResetEditor}>
            Reset Editor
          </button>
        </div>
      </nav>
      <section>
        <div className="mx-auto max-w-[700px] w-full">
          <div className="relative  hover:opacity-80 bg-surface border-2 border-blue rounded-md">
            <label htmlFor="uploadBanner">
              <img
                src={banner || "/news-banner.png"}
                alt="Default Banner"
                className="z-20 max-h-[800px] object-contain h-full w-full"
                onError={handleError}
              />

              <input
                type="file"
                id="uploadBanner"
                accept=".png, .jpg, .jpeg, .webp"
                hidden
                onChange={handleChangeBanner}
              />
            </label>
          </div>

          <textarea
            defaultValue={title}
            placeholder="News Title"
            className="text-2xl font-medium w-full h-20 outline-none resize-none mt-5 leading-tight placeholder:opacity-40 bg-surface"
            onKeyDown={handleTitleKeyDown}
            onChange={handleTitleChange}
          ></textarea>
          <hr className="w-full opacity-10 my-5" />
          <label className="text-fg text-lg">
            Description
          </label>
          <textarea
            maxLength={charLength}
            defaultValue={description}
            className="h-40 resize-none leading-7 input-box pl-4"
            onChange={handleChangeDescription}
            onKeyDown={(e) => {
              if (e.keyCode === 13) e.preventDefault();
            }}
          ></textarea>
        </div>
      </section>
    </div>
  );
};

export default CreateEventNews;
