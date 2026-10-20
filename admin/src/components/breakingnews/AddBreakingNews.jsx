import React, { useState, useEffect } from "react";
// import "./EditUser.css";
import { useRef } from "react";
import toast from "react-hot-toast";
import httpClient from "../../api/httpClient";
import TextareaFields from "../../utils/TextareaFields";

const AddBreakingNews = ({ setAddBreakingNews, refetch }) => {
  const [news, setNews] = useState({
    title: "",
  });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNews({ ...news, [name]: value });
  };

  const handleSave = (e) => {
    if (!news.title || !news.title.trim()) {
      return toast.error("Please Enter the title of news");
    }

    // Disable the button using the event target
    e.target.disabled = true;
    e.target.classList.add("opacity-50", "cursor-not-allowed"); // optional: for visual feedback

    const loadingToast = toast.loading("Adding...");
    httpClient
      .post("add-breaking-news", { ...news })
      .then(({ data }) => {
        toast.dismiss(loadingToast);
        if (data.success) {
          toast.success("News added successfully");
          setAddBreakingNews(false);
          refetch();
        } else {
          toast.error(data.message);
          e.target.disabled = false;
          e.target.classList.remove("opacity-50", "cursor-not-allowed");
        }
      })
      .catch((err) => {
        toast.dismiss(loadingToast);
        toast.error(
          err.response?.data?.error || err.message || "Something went wrong"
        );
        e.target.disabled = false;
        e.target.classList.remove("opacity-50", "cursor-not-allowed");
      });
  };

  return (
    <>
      <form onSubmit={handleSave}>
        <TextareaFields
          LabelTitle="Title"
          inputVal={news.title}
          handleInputValue={handleChange}
          name="title"
          required={true}
          placeholder={"Enter the title"}
        />

        <div className="flex justify-between mt-2">
          <button
            type="button"
            className="btn-blue-outline"
            onClick={() => setAddBreakingNews(false)}
          >
            Cancel
          </button>
          <button type="button" className="btn-blue" onClick={handleSave}>
            Add
          </button>
        </div>
      </form>
    </>
  );
};

export default AddBreakingNews;
