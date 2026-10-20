import ImageTool from "@editorjs/image";
import EditorjsList from "@editorjs/list";
import Header from "@editorjs/header";
import Paragraph from "@editorjs/paragraph";
import LinkTool from "@editorjs/link";
import Checklist from "@editorjs/checklist";
import Embed from "@editorjs/embed";
import Quote from "@editorjs/quote";
import Warning from "@editorjs/warning";
import Table from "@editorjs/table";
import { uploadImage } from "../api/imagehandle";
import AlignmentTune from "editor-js-alignment-tune";
import Delimiter from "@editorjs/delimiter";
import ColorPicker from "editorjs-color-picker";

const uploadImageByURL = (url) => {
  return Promise.resolve({
    success: 1,
    file: { url },
  });
};

const uploadImageByFile = async (file) => {
  try {
    const url = await uploadImage(file); // Make sure this returns the image URL
    return {
      success: 1,
      file: { url },
    };
  } catch (err) {
    console.error("Upload failed:", err);
    return {
      success: 0,
      message: "Image upload failed",
    };
  }
};

export const tools = {
  list: {
    class: EditorjsList,
    inlineToolbar: true,
    config: {
      defaultStyle: "unordered",
    },
  },
  paragraph: {
    class: Paragraph,
    tunes: ["alignmentTune"],
    inlineToolbar: true,
  },
  header: {
    class: Header,
    config: {
      placeholder: "Type Heading ....",
      levels: [2, 3, 4],
      defaultLevel: 2,
    },
    tunes: ["alignmentTune"],
  },
  linkTool: {
    class: LinkTool,
  },
  image: {
    class: ImageTool,
    config: {
      uploader: {
        uploadByFile(file) {
          return uploadImageByFile(file);
        },
        uploadByUrl: uploadImageByURL,
      },
      captionPlaceholder: "Enter a caption...",
    },
  },
  checklist: {
    class: Checklist,
    inlineToolbar: true,
  },
  embed: {
    class: Embed,
    config: {
      services: {
        youtube: true,
        coub: true,
        facebook: true,
        instagram: true,
        twitter: true,
        codepen: true,
      },
    },
  },
  warning: {
    class: Warning,
    inlineToolbar: true,
    shortcut: "CMD+SHIFT+W",
    config: {
      titlePlaceholder: "Title",
      messagePlaceholder: "Message",
    },
  },
  table: Table,
  alignmentTune: {
    class: AlignmentTune,
  },
  delimiter: Delimiter,
  ColorPicker: {
    class: ColorPicker,
  },
  quote: Quote,
};
