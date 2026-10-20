import React, { useState, useEffect } from "react";
// import "./EditUser.css";
import { useRef } from "react";
import toast from "react-hot-toast";
import httpClient from "../../api/httpClient";
import TextareaFields from "../../utils/TextareaFields";
import InputFields from "../../utils/InputFields";
import { Calendar, Link, Mail } from "lucide-react";

const AddAdvertisementNews = ({ setAddBreakingNews, refetch }) => {
  const today = new Date().toISOString().split("T")[0];
  const calculateExpireDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 7);
    return today.toISOString().split("T")[0]; // Format as YYYY-MM-DD
  };

  const [news, setNews] = useState({
    title: "",
    link: "",
    email: "",
    expireDate: calculateExpireDate(), // Set initial value to 7 days from today
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNews({ ...news, [name]: value });
  };

  const handleSave = (e) => {
    if (!news.title) {
      return toast.error("Please Enter the title of news");
    }
    if (!news.expireDate) {
      return toast.error("Please make sure about the expire Date");
    }

    // Disable the button using the event target
    e.target.disabled = true;
    e.target.classList.add("opacity-50", "cursor-not-allowed"); // optional: for visual feedback

    const loadingToast = toast.loading("Adding...");
    httpClient
      .post("ads-title/add", { ...news })
      .then(({ data }) => {
        toast.dismiss(loadingToast);
        if (data.success) {
          toast.success("Title Ads added successfully");
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

        <InputFields
          LabelTitle="Link"
          inputVal={news.link}
          handleInputValue={handleChange}
          name="link"
          placeholder={"https://somedomain.com..."}
          icon={Link}
        />
        <InputFields
          LabelTitle="Email"
          inputVal={news.email}
          handleInputValue={handleChange}
          name="email"
          type="email"
          placeholder={"example@gmail.com..."}
          icon={Mail}
        />
        <InputFields
          LabelTitle="Date"
          inputVal={news.expireDate}
          handleInputValue={handleChange}
          name="expireDate"
          type="date"
          placeholder={"12/12/2030..."}
          icon={Calendar}
          min={today}
          required={true}
        />

        <div className="flex justify-between mt-2">
          <button
            type="button"
            className="btn-blue-outline"
            onClick={() => setAddBreakingNews(false)}
          >
            Cancel
          </button>
          <button type="button" className="btn-red" onClick={handleSave}>
            Add
          </button>
        </div>
      </form>
    </>
  );
};

export default AddAdvertisementNews;
