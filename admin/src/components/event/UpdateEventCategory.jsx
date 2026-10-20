import { useState } from "react";
import InputFields from "../../utils/InputFields";
import { TableOfContents } from "lucide-react";
import { Calendar } from "lucide-react";
import TextareaFields from "../../utils/TextareaFields";
import SelectField from "../../utils/SelectField";
import toast from "react-hot-toast";
import httpClient from "../../api/httpClient";
const UpdateEventCategory = ({ event, setIsEditCategory, refetch }) => {
  const [category, setCategory] = useState(event);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCategory({ ...category, [name]: value });
  };
  const today = new Date().toISOString().split("T")[0];

  const handleSave = (e) => {
    e.preventDefault();
    if (!category.title) {
      return toast.error("Please Enter the title of category");
    }
    if (!category.title_hindi) {
      return toast.error("Please Enter the hindi title of category");
    }
    if (!category.start_date) {
      return toast.error("Please make sure about the start Date");
    }
    if (!category.end_date) {
      return toast.error("Please make sure about the end Date");
    }
    if (new Date(category.start_date) > new Date(category.end_date)) {
      return toast.error("Start Date cannot be after End Date");
    }
    if (!category.status) {
      return toast.error("Please make sure about the Status");
    }

    // Disable the button using the event target
    e.target.disabled = true;
    e.target.classList.add("opacity-50", "cursor-not-allowed"); // optional: for visual feedback

    const loadingToast = toast.loading("Updating...");
    httpClient
      .put(`update-category/${category._id}`, { ...category })
      .then(({ data }) => {
        toast.dismiss(loadingToast);
        toast.success("Category updated successfully");
        setIsEditCategory(false);
        refetch();
        e.target.disabled = false;
        e.target.classList.remove("opacity-50", "cursor-not-allowed");
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
    <form onSubmit={handleSave}>
      {/* Title Field */}
      <InputFields
        LabelTitle="Event Name"
        inputVal={category.title}
        handleInputValue={handleChange}
        name="title"
        placeholder="Enter Event Name"
        icon={TableOfContents}
        required={true}
      />
      <InputFields
        LabelTitle="Event Name in Hindi"
        inputVal={category.title_hindi}
        handleInputValue={handleChange}
        name="title_hindi"
        placeholder="Enter Event Name in Hindi"
        icon={TableOfContents}
        required={true}
      />

      {/* End Date Field */}
      <InputFields
        LabelTitle="End Date"
        inputVal={category.start_date}
        handleInputValue={handleChange}
        name="start_date"
        placeholder="Select start date"
        type="date"
        icon={Calendar}
        min={today}
        required={true}
      />

      {/* End Date Field */}
      <InputFields
        LabelTitle="End Date"
        inputVal={category.end_date}
        handleInputValue={handleChange}
        name="end_date"
        placeholder="Select end date"
        type="date"
        icon={Calendar}
        min={today}
        required={true}
      />
      <SelectField
        LabelTitle="Event Status"
        selectVal={category.status}
        handleSelectChange={handleChange}
        name="status"
        placeholder="Select status"
        options={[
          { label: "Select Option", value: "" },
          { label: "Active", value: "active" },
          { label: "Upcoming", value: "upcoming" },
          { label: "Ended", value: "ended" },
        ]}
        icon={Calendar}
        required={true}
      />

      {/* Description TextArea (Custom rendering if InputFields supports textarea type) */}
      <TextareaFields
        LabelTitle="Description"
        inputVal={category.description}
        handleInputValue={handleChange}
        name="description"
        placeholder="Enter description"
        type="textarea" // Add handling for this inside InputFields
      />
      <div className="flex justify-between mt-2">
        <button
          type="button"
          className="btn-blue-outline"
          onClick={() => setIsEditCategory(false)}
        >
          Cancel
        </button>
        <button type="button" className="btn-red" onClick={handleSave}>
          Update
        </button>
      </div>
    </form>
  );
};

export default UpdateEventCategory;
