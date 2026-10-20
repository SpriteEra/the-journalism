import React, { useContext, useEffect, useRef } from "react";
import EditorJS from "@editorjs/editorjs";
import { useState } from "react";
import { tools } from "../../utils/EditorTools";
import InputFields from "../../utils/InputFields";
import { useNavigate } from "react-router-dom";
import httpClient from "../../api/httpClient";
import toast from "react-hot-toast";
import TextareaFields from "../../utils/TextareaFields";
import { EditorContext } from "../../pages/blogs/AddBlog";
import Tag from "../../utils/Tag";
import { CirclePlus as IoIosAddCircle } from "lucide-react";
import EditorSetup from "../../utils/EditorSetup";

let tagLimit = 30;
const BlogEditor = () => {
  const {
    blog,
    blog: { tags, title, feature_image, description, content, imageRef },
    setBlog,
  } = useContext(EditorContext);
  const [tagData, setTagData] = useState("");

  const handleTag = () => {
    let tag = tagData;
    setTagData(tag);
    if (tags?.length < tagLimit) {
      if (!tags.includes(tag) && tag.length) {
        setBlog({ ...blog, tags: [...tags, tag] });
      }
    } else {
      toast.error(`You can add max ${tagLimit} tags`);
    }
    setTagData("");
  };

  const handleKeyDown = (e) => {
    if (e.keyCode === 13 || e.keyCode === 188) {
      e.preventDefault();
      let tag = e.target.value;
      if (tags?.length < tagLimit) {
        if (!tags.includes(tag) && tag.length) {
          setBlog({ ...blog, tags: [...tags, tag] });
        }
      } else {
        toast.error(`You can add max ${tagLimit} tags`);
      }
      setTagData("");
    }
  };

  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setImagePreview(URL.createObjectURL(file));
      setImageFile(file); // Save file for uploading
    }
  };

  const inputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setImage(URL.createObjectURL(file));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBlog((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditorChange = (data) => {
    setBlog({ ...prev, content: data });
  };

  //   const getCurrentDateTimeLocal = () => {
  //     const now = new Date();
  //     now.setSeconds(0, 0); // remove seconds/milliseconds
  //     const offset = now.getTimezoneOffset();
  //     const localDateTime = new Date(now.getTime() - offset * 60000);
  //     return localDateTime.toISOString().slice(0, 16); // returns "YYYY-MM-DDTHH:mm"
  //   };

  //   useEffect(() => {
  //     if (!ejInstance.current) {
  //       ejInstance.current = new EditorJS({
  //         placeholder: "Let's create a new contest",
  //         holder: "editorjs",
  //         tools: tools,
  //         onReady: () => {
  //           console.log("Editor.js is ready to work!");
  //         },
  //         onChange: async (api, event) => {
  //           const content = await ejInstance.current.save();
  //           setData(content);
  //           setBlog({
  //             ...blog,
  //             content: content,
  //           });

  //           const currentBlocks = content.blocks;
  //           const previousBlocks = previousBlocksRef.current;

  //           // Detect deleted blocks
  //           if (previousBlocks.length > currentBlocks.length) {
  //             const deletedBlocks = previousBlocks.filter(
  //               (prevBlock) =>
  //                 !currentBlocks.find(
  //                   (currBlock) => currBlock.id === prevBlock.id
  //                 )
  //             );

  //             deletedBlocks.forEach((block) => {
  //               console.log(`Deleted block type: ${block.type}`);
  //               if (block.type === "image") {
  //                 const imageUrl = block.data.url;
  //                 console.log(block);
  //                 handleDeleteImage(imageUrl);
  //               }
  //             });
  //           }

  //           // Update previous blocks
  //           previousBlocksRef.current = currentBlocks;
  //         },
  //       });
  //     }

  //     return () => {
  //       if (ejInstance.current && ejInstance.current.destroy) {
  //         ejInstance.current.destroy();
  //         ejInstance.current = null;
  //       }
  //     };
  //   }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    console;
    formData.append("title", title);
    formData.append("description", description);
    formData.append("tags", JSON.stringify(tags));
    formData.append("content", JSON.stringify(content));
    // Append image file if available
    if (imageFile) {
      formData.append("image", imageFile);
    }

    // Example: send using fetch
    let loadingToast = toast.loading("Contest Creating...");
    try {
      const { data: resData } = await httpClient.post(
        "/blog/create",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast.dismiss(loadingToast);
      toast.success("Contest Created Successfully");

      navigate(`/contest/${resData.contest_id}`);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "something went wrong"
      );
      console.error("Error submitting form:", error);
    }
  };

  return (
    <div className="text-fg">
      <div className="flex justify-between mb-2 sticky -top-10 z-10 py-3 bg-surface-2">
        <h2 className="text-xl font-semibold">Create Blog</h2>
        <div className="flex gap-2">
          <button className="btn-blue-outline">Reset</button>
          <button className="btn-blue" onClick={handleSubmit}>
            Create
          </button>
        </div>
      </div>
      <div
        className="border rounded-md w-full h-[500px] max-w-[1000px] bg-surface-2 flex items-center justify-center text-center cursor-pointer relative overflow-hidden mb-3 mx-auto"
        onClick={() => inputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {imagePreview ? (
          <img
            src={imagePreview}
            alt="Uploaded banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div>
            <p className="text-2xl font-medium">Upload Banner</p>
            <p className="text-sm text-fg-subtle">
              (1200 X 300)
            </p>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={inputRef}
          onChange={handleChange}
        />
      </div>

      <InputFields
        LabelTitle={"Blog Title"}
        name={"title"}
        inputVal={title}
        placeholder={"Enter the blog title"}
        handleInputValue={handleInputChange}
      />
      <TextareaFields
        LabelTitle={"Blog Description"}
        name={"description"}
        inputVal={description}
        placeholder={"Enter the blog description"}
        handleInputValue={handleInputChange}
      />
      <InputFields
        LabelTitle={"Image Caption"}
        name={"imageRef"}
        inputVal={imageRef}
        placeholder={""}
        handleInputValue={handleInputChange}
      />
      <div className="py-2 mt-5">
        <h2 className="block font-normal text-fg-subtle">
          Tags - ( Helps in searching and ranking your blog )
        </h2>
        <div className="flex flex-col w-[100%] text-[16px] font-normal text-fg placeholder:text-fg-faint border border-line-strong rounded-md p-5 mt-1">
          <div className="flex items-center">
            <input
              type="text"
              value={tagData}
              placeholder="Tags"
              onKeyDown={handleKeyDown}
              onChange={(e) => {
                setTagData(e.target.value);
              }}
              className="sticky input-box top-0 left-0 pl-4 border p-2 rounded-md outline-none border-line-strong"
            />
            <button className="ml-2 cursor-pointer" onClick={handleTag}>
              <IoIosAddCircle
                size={30}
                className="text-info pointer-events-none"
              />
            </button>
          </div>
          <div>
            {tags &&
              tags.map((tag, i) => {
                return <Tag key={i} tagIndex={i} tag={tag} />;
              })}
          </div>
        </div>
        <p className="mt-1 pt-1 mb-4 text-dark-grey text-right">
          {tagLimit - tags?.length} Tags left
        </p>
      </div>
      <EditorSetup initialData={blog.content} onChange={handleEditorChange} />
    </div>
  );
};

export default BlogEditor;
