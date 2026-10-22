import ImageTool from "@editorjs/image";
import EditorjsList from "@editorjs/list";
import Header from "@editorjs/header";
import Paragraph from "@editorjs/paragraph";
import Checklist from "@editorjs/checklist";
import Embed from "@editorjs/embed";
import Quote from "@editorjs/quote";
import Warning from "@editorjs/warning";
import Table from "@editorjs/table";
import { uploadImage } from "../api/imagehandle";
import AlignmentTune from "editor-js-alignment-tune";
import Delimiter from "@editorjs/delimiter";
import ColorPicker from "editorjs-color-picker";
import RawPreview from "./RawPreview";
import CustomHyperlink from "./CustomHyperlink";

const uploadImageByURL = (url) => {
  return Promise.resolve({
    success: 1,
    file: { url },
  });
};

const uploadImageByFile = async (file) => {
  try {
    const url = await uploadImage(file);
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
    inlineToolbar: ["customHyperlink", "bold", "italic", "ColorPicker"],
    config: {
      preserveBlank: true,
    },
    sanitizer: {
      a: {
        href: true,
        target: true,
        rel: true,
        class: true,
      },
    },
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
  customHyperlink: CustomHyperlink,
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
        youtube: {
          regex: /(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})[^\s]*/,
          embedUrl: "https://www.youtube.com/embed/<%= remote_id %>",
          html: '<iframe height="320" width="580" style="width:100%" frameborder="0" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>',
          height: 320,
          width: 580,
          id: (groups) => groups[0],
        },
        instagram: true,
        twitter: true,
        codepen: true,
      },
    },
  },
  raw: { class: RawPreview },

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
  alignmentTune: { class: AlignmentTune },
  delimiter: Delimiter,
  ColorPicker: { class: ColorPicker },
  quote: Quote,
};
