import { useState } from "react";
import httpClient from "../../api/httpClient";
import toast from "react-hot-toast";

const EditBreakingNewsHandler = ({ news, setEditBreakingNews, refetch }) => {
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
      .put(`admin/update-news/${news._id}`, { ...data })
      .then(({ data }) => {
        toast.dismiss(loadingToast);
        if (data.success) {
          toast.success("Breaking News updated successfully");
          setEditBreakingNews(false);
          refetch();
        } else {
          toast.error(data.message);
          e.target.disabled = false;
          e.target.classList.remove("opacity-50", "cursor-not-allowed");
        }
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
        <div className="form-group">
          <label htmlFor="title" className="required">
            Title 
          </label>
          <textarea
            type="text"
            id="title"
            name="title"
            value={data.title}
            className="w-full border rounded-md resize-none border-blue p-2"
            onChange={handleChange}
            rows={5}
            required
          />
        </div>
      </form>

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
    </>
  );
};

export default EditBreakingNewsHandler;
