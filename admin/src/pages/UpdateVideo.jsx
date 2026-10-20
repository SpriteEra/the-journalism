import React, { useEffect, useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { findHindi, stateDistricts } from "../common/data";
import Tag from "../components/tag.component";
import { CirclePlus as IoIosAddCircle } from "lucide-react";
import { useFetchSingleYtNews } from "../hooks/ytnews";

const ytVideoStructure = {
  id: "",
  title: "",
  videoLinkId: "",
  description: "",
  tags: [],
  state: "",
  district: "",
  location: "",
};

const UpdateVideo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [tagData, setTagData] = useState("");
  const [ytData, setYtData] = useState(ytVideoStructure);
  const [choosenState, setChoosenState] = useState("");
  const [choosenDistrict, setChoosenDistrict] = useState("");

  const searchParams = new URLSearchParams(location.search);
  const video_id = searchParams.get("video_id");
  const params = useParams();

  const { data, isPending, isError, error } = useFetchSingleYtNews();

  useEffect(() => {
    if (video_id) fetchNews();
    window.scrollTo(0, 0);
  }, [video_id]);

  const fetchNews = () => {
    setLoading(true);
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/get-youtube-news", {
        video_id,
        draft: false,
        mode: "edit",
      })
      .then(({ data: { news } }) => setYtData(news))
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  };

  const handleChange = (e) =>
    setYtData({ ...ytData, [e.target.name]: e.target.value });

  function getYouTubeVideoID(url) {
    const regex = /(?:youtube\.com\/.*v=|youtu\.be\/)([^&\n?#]+)/;

    const match = url.match(regex);

    return match ? match[1] : null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    ytData.videoLinkId = getYouTubeVideoID(ytData.videoLinkId);
    const formData = { ...ytData, id: video_id, tags: ytData.tags };
    e.target.setAttribute("disabled", true);
    const loadingToast = toast.loading(
      video_id ? "Updating..." : "Creating..."
    );
    axios.defaults.withCredentials = true;
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/create-yt-news", formData)
      .then(() => {
        toast.dismiss(loadingToast);
        toast.success(
          `YouTube Video ${video_id ? "Updated" : "Added"} Successfully`
        );
        navigate("/dashboard/all-videos-data");
      })
      .catch(({ response }) => toast.error(response.data.message))
      .finally(() => {
        e.target.removeAttribute("disabled");
        toast.dismiss(loadingToast);
      });
  };

  const handleKeyDown = (e) => {
    if (e.keyCode === 13 || e.keyCode === 188) {
      e.preventDefault();
      const tag = e.target.value.trim();
      if (tag && !ytData.tags.includes(tag) && ytData.tags.length < 10) {
        setYtData({ ...ytData, tags: [...ytData.tags, tag] });
        setTagData("");
      } else {
        toast.error("You can add max 10 tags");
      }
    }
  };

  const handleTagAdd = () => {
    const tag = tagData.trim();
    if (tag && !ytData.tags.includes(tag) && ytData.tags.length < 10) {
      setYtData({ ...ytData, tags: [...ytData.tags, tag] });
      setTagData("");
    } else {
      toast.error("You can add max 10 tags");
    }
  };

  const handleStateChange = (e) => {
    const state = e.target.value;
    setChoosenState(state);
    setChoosenDistrict("");
    setYtData({ ...ytData, state });
  };

  return (
    <div className="p-5 md:p-10 w-full">
      <h1 className="max-md:hidden mb-5 text-3xl font-semibold text-fg">
        {video_id ? "Update" : "Add"} YouTube Video
      </h1>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-5">
          <div className="flex flex-col gap-y-1">
            <label className="text-2xl font-semibold text-blue required-text">
              Title of the video
            </label>
            <input
              name="title"
              type="text"
              value={ytData.title}
              onChange={handleChange}
              placeholder="Enter the title of the video"
              className="input-box mb-5 pl-4"
            />
          </div>
          <div className="flex flex-col gap-y-1">
            <label className="text-2xl font-semibold text-blue required-text">
              Enter the video Id
            </label>
            <input
              name="videoLinkId"
              type="text"
              value={ytData.videoLinkId}
              onChange={handleChange}
              placeholder="Enter the YouTube video ID (e.g. 3hbld99ue3)"
              className="input-box mb-5 pl-4"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-5">
          <div className="flex flex-col gap-y-1">
            <label className="text-2xl font-semibold text-blue required-text">
              Enter the description of the video
            </label>
            <textarea
              name="description"
              value={ytData.description}
              onChange={handleChange}
              className="input-box h-64 lg:h-40 resize-none leading-7 pl-5"
              placeholder="Video Description"
            ></textarea>
          </div>
          <div className="flex flex-col gap-y-1">
            <label className="text-2xl font-semibold text-blue required-text">
              Enter the tags related to the video
            </label>
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Tags Related to the video (Press Enter to add)"
                value={tagData}
                onChange={(e) => setTagData(e.target.value)}
                onKeyDown={handleKeyDown}
                className="sticky input-box pl-4 mb-3"
                name="tags"
              />
              <button type="button" onClick={handleTagAdd}>
                <IoIosAddCircle
                  size={25}
                  className="text-dark-grey pointer-events-none"
                />
              </button>
            </div>
            <div>
              {ytData.tags.map((tag, i) => (
                <Tag
                  key={i}
                  tagIndex={i}
                  tag={tag}
                  ytData={ytData}
                  setYtData={setYtData}
                />
              ))}
            </div>
            <div className="flex flex-col gap-y-1">
              <label className="text-2xl font-semibold text-blue required-text">
                Enter the location of the video
              </label>
              <input
                type="text"
                placeholder="Location (Incident location)"
                name="location"
                value={ytData.location}
                onChange={handleChange}
                className="sticky input-box pl-4 mb-3"
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-5">
          <div className="flex flex-col gap-y-1">
            <label className="text-2xl font-semibold text-blue">
              Choose the state of the video
            </label>
            <select
              name="state"
              value={choosenState}
              onChange={handleStateChange}
              className="input-box mb-5 pl-4 capitalize"
            >
              <option value="" disabled>
                Select State
              </option>
              {Object.keys(stateDistricts).map((state, i) => (
                <option key={i} value={state} className="capitalize">
                  {findHindi(state)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-y-1">
            <label className="text-2xl font-semibold text-blue">
              Choose the district of news
            </label>
            <select
              name="district"
              value={choosenDistrict}
              onChange={(e) => {
                setChoosenDistrict(e.target.value);
                setYtData({ ...ytData, district: e.target.value });
              }}
              disabled={!choosenState}
              className="input-box mb-5 pl-4 capitalize"
            >
              <option value="" disabled>
                Select District
              </option>
              {stateDistricts[choosenState]?.map((district, i) => (
                <option key={i} value={district.english} className="capitalize">
                  {district.hindi}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button className="btn-dark px-10 mt-5" type="submit">
          {video_id ? "Update Now" : "Add Now"}
        </button>
      </form>
    </div>
  );
};

export default UpdateVideo;
