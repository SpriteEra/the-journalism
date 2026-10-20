import { useState } from "react";
import httpClient from "../../api/httpClient";
import toast from "react-hot-toast";
import InputFields from "../../utils/InputFields";
import { BadgeDollarSign, Link, Mail } from "lucide-react";
import TextareaFields from "../../utils/TextareaFields";

const EditTitleAds = ({ news, setEditBreakingNews, refetch }) => {
  const [data, setData] = useState(news);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });
  };

  const handleSave = (e) => {
    // Disable the button immediately
    e.target.disabled = true;
    e.target.classList.add("opacity-50", "cursor-not-allowed");

    const loadingToast = toast.loading("Updating...");

    if (!data.title) {
      toast.dismiss(loadingToast);
      toast.error("Please Enter the Title of the breaking news");
      e.target.disabled = false;
      e.target.classList.remove("opacity-50", "cursor-not-allowed");
      return;
    }

    httpClient
      .put(`update-title-ads/${news._id}`, { ...data })
      .then(({ data }) => {
        toast.dismiss(loadingToast);
        toast.success("Title Ads updated successfully");
        refetch();
        setEditBreakingNews(false);
        e.target.disabled = false;
        e.target.classList.remove("opacity-50", "cursor-not-allowed");
      })
      .catch((err) => {
        toast.dismiss(loadingToast);
        toast.error(err.response?.data?.error || "Something went wrong");
        e.target.disabled = false;
        e.target.classList.remove("opacity-50", "cursor-not-allowed");
      });
  };

  return (
    <>
      <form onSubmit={handleSave}>
        <TextareaFields
          LabelTitle="Title"
          inputVal={data.title}
          handleInputValue={handleChange}
          name="title"
          required={true}
          placeholder={"Enter the title"}
        />
        <InputFields
          LabelTitle="Email"
          inputVal={data.email}
          handleInputValue={handleChange}
          name="email"
          icon={Mail}
          placeholder={"Enter the Email"}
        />
        <InputFields
          LabelTitle="Link"
          inputVal={data.link}
          handleInputValue={handleChange}
          name="link"
          icon={Link}
          placeholder={"Enter the website link"}
        />
        <div className="flex justify-between mt-2">
          <button
            type="button"
            className="btn-blue-outline"
            onClick={() => setEditBreakingNews(false)}
          >
            Cancel
          </button>
          <button type="button" className="btn-blue" onClick={handleSave}>
            Edit
          </button>
        </div>
      </form>
    </>
  );
};

export default EditTitleAds;
