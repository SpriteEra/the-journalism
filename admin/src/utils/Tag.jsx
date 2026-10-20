import { X as IoMdClose } from "lucide-react";

const Tag = ({ tag, tagIndex, data, setData }) => {
  let tags = data;
  const handleDeleteTag = () => {
    tags = tags.filter((t) => t !== tag);
    setData(tags);
  };
  const handleTagEdit = (e) => {
    if (e.keyCode === 13 || e.keyCode === 188) {
      e.preventDefault();
      let currentTag = e.target.innerText;
      tags[tagIndex] = currentTag;
      setData(tags);
      e.target.setAttribute("contentEditable", false);
    }
  };
  const addEditable = (e) => {
    e.target.setAttribute("contentEditable", true);
    e.target.focus();
  };
  return (
    <div className="relative p-1 sm:p-2 mt-2 mr-2 px-5 bg-surface rounded-full inline-block hover:bg-surface-2 !pr-10 border border-line shadow-card">
      <p
        className="outline-none"
        onClick={addEditable}
        onKeyDown={handleTagEdit}
      >
        {tag}
      </p>
      <button
        onClick={handleDeleteTag}
        type="button"
        className="mt-[2px] rounded-full absolute right-3 top-1/2 -translate-y-1/2"
      >
        <IoMdClose size={20} className="text-sm pointer-events-none" />
      </button>
    </div>
  );
};

export default Tag;
