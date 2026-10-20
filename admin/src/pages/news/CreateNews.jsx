import React, { createContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import BlogEditor from "../../components/BlogEditor.jsx";
import Loader from "../../components/Loader.jsx";
import PublishForm from "../../components/PublishForm.jsx";
import httpClient from "../../api/httpClient.js";
import { normalizeBlog } from "../../components/taxonomy/TaxonomyFields.jsx";
const Todaydate = new Date().toISOString().split("T")[0];
const blogStructure = {
  title: "",
  banner: "",
  content: [],
  tags: [],
  keywords: { hi: [], en: [] },
  seo: {},
  related: [],
  layout: "standard",
  feature: { enabled: false, until: "" },
  description: "",
  video: null,
  is_literature: false,
  isVideo: false,
  category: [],
  subCategory: [],
  state: [],
  district: [],
  location: "",
  ref_reporter: "",
  post_time: {
    date: Todaydate,
    time: "",
  },
  imageRef: "",
  sendNotification: false,
  breaking_news: false,
  author: { personal_info: {} },


  aiGeneratedTags: [],
};

export const EditorContext = createContext({});
const CreateNews = () => {
  let { news_id } = useParams();
  const [blog, setBlog] = useState(blogStructure);
  const [editorState, setEditorState] = useState("editor");
  const [textEditor, setTextEditor] = useState({ isReady: false });
  const [hasChanges, setHasChanges] = useState(false);

  const [loading, setLoading] = useState(true);
  // console.log(access_token)

  useEffect(() => {
    if (!news_id) {
      return setLoading(false);
    }

    const query = new URLSearchParams(window.location.search);
    const type = query.get("type");

    let fetchUrl = "/";

    switch (type) {
      case "schedule_news":
        fetchUrl = "/get-scheduled-news";
        break;
      case "guest-news":
        fetchUrl = "/get-guest-news";
        break;

      default:
        fetchUrl = "/get-single-news";
        break;
    }
    httpClient
      .get(fetchUrl + `?news_id=${news_id}`, {
        news_id,
        mode: "edit",
      })
      .then(({ data: { news } }) => {
        setBlog(normalizeBlog(news));
        setLoading(false);
      })
      .catch((err) => {
        setBlog(null);
        setLoading(false);
        console.log(err);
      });
  }, [news_id]);

  return (
    <EditorContext.Provider
      value={{
        blog,
        setBlog,
        editorState,
        setEditorState,
        textEditor,
        hasChanges,
        setHasChanges,
        setTextEditor,
      }}
    >
      {loading ? (
        <Loader />
      ) : editorState === "editor" ? (
        <BlogEditor />
      ) : (
        <PublishForm />
      )}
    </EditorContext.Provider>
  );
};

export default CreateNews;
