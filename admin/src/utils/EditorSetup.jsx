import { normalizeBlog } from "../components/taxonomy/TaxonomyFields.jsx";
import React, { useEffect, useRef } from "react";
import EditorJS from "@editorjs/editorjs";
import { tools } from "./EditorTools";

const EditorSetup = ({ initialData = {}, onChange, setTextEditor, textEditor, setBlog, content }) => {
  const editorInstance = useRef(null);
  const previousBlocksRef = useRef([]);
  const editorId = useRef(`editorjs-${Math.random().toString(36).substr(2, 9)}`);
    useEffect(() => {
      const autoSave = () => {
        if (textEditor.isReady && hasChanges) {
          textEditor.save().then((data) => {
            const updatedBlog = { ...blog, content: data };
            setBlog(updatedBlog);
            localStorage.setItem("blog", JSON.stringify(updatedBlog));
  
            // Send auto-save request to server
            // axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/create-news", {
            //   ...updatedBlog,
            //   id: news_id,
            //   draft: true,
            // });
  
            // Reset hasChanges to false after saving
            setHasChanges(false);
          });
        }
      };
  
      const intervalId = setInterval(autoSave, 5000);
  
      return () => clearInterval(intervalId);
    }, [textEditor, blog, news_id, setBlog, hasChanges]);
  useEffect(() => {
    const savedBlog = JSON.parse(localStorage.getItem("blog"));
    if (savedBlog) {
      setBlog(normalizeBlog(savedBlog));
    }

    if (!textEditor.isReady) {
      setTextEditor(
        new EditorJS({
          holderId: "textEditor",
          data: savedBlog
            ? savedBlog.content
            : Array.isArray(content)
            ? content[0]
            : content,
          tools: tools,
          placeholder: "Let's write an awesome news",
          onChange: () => setHasChanges(true),
        })
      );
    }
  }, []);


  return <div id="textEditor" className="font-anekdevanagari"></div>
;
};

export default EditorSetup;

// useEffect(() => {
//   if (editorInstance.current) return;
//   if (!editorInstance.current) {
//     editorInstance.current = new EditorJS({
//       placeholder: "Let's write an awosome news!",
//       holder: editorId.current,
//       tools: tools,
//       onReady: () => {
//         console.log("Editor.js is ready to work!");
//       },
//       onChange: async (api, event) => {
//         const content = await editorInstance.current.save();
//         onChange(content);

//         const currentBlocks = content.blocks;
//         const previousBlocks = previousBlocksRef.current;

//         // Detect deleted blocks
//         if (previousBlocks.length > currentBlocks.length) {
//           const deletedBlocks = previousBlocks.filter(
//             (prevBlock) =>
//               !currentBlocks.find(
//                 (currBlock) => currBlock.id === prevBlock.id
//               )
//           );

//           deletedBlocks.forEach((block) => {
//             console.log(`Deleted block type: ${block.type}`);
//             if (block.type === "image") {
//               const imageUrl = block.data.url;
//               console.log(block);
//               handleDeleteImage(imageUrl);
//             }
//           });
//         }

//         // Update previous blocks
//         previousBlocksRef.current = currentBlocks;
//       },
//     });
//   }

//   return () => {
//     if (editorInstance.current && editorInstance.current.destroy) {
//       editorInstance.current.destroy();
//       editorInstance.current = null;
//     }
//   };
// }, []);
