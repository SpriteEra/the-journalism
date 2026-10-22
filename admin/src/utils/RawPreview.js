export default class RawPreview {
  static get toolbox() {
    return {
      title: "Embed",
      icon: '<svg width="17" height="15"><path d="M7.7 0L0 7.5L7.7 15l1.2-1.2L2.4 7.5l6.5-6.3L7.7 0zm1.6 0l7.7 7.5l-7.7 7.5l-1.2-1.2l6.5-6.3l-6.5-6.3L9.3 0z"/></svg>',
    };
  }

  constructor({ data }) {
    this.data = data || {};
    this.wrapper = null;
    this.textarea = null;
    this.preview = null;
  }

  // Correct regex to strip out all <script> tags
  sanitizeHTML(html) {
    return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  }

  refreshPreview = () => {
    if (this.preview && this.textarea) {
      this.preview.innerHTML = this.sanitizeHTML(this.textarea.value);

      // Delay to ensure async scripts are loaded before processing
      setTimeout(() => {
        // Twitter embed processing for tweets
        if (window.twttr && window.twttr.widgets) {
          window.twttr.widgets.load(this.preview);
        }

        // Instagram embed processing for instagram posts
        if (
          window.instgrm &&
          window.instgrm.Embeds &&
          typeof window.instgrm.Embeds.process === "function"
        ) {
          window.instgrm.Embeds.process();
        }
      }, 100);
    }
  };

  render() {
    this.wrapper = document.createElement("div");
    this.wrapper.classList.add("raw-preview-wrapper");

    this.textarea = document.createElement("textarea");
    this.textarea.classList.add("cdx-input");
    this.textarea.placeholder = "Paste your HTML code...";
    this.textarea.value = this.data.html || "";

    this.preview = document.createElement("div");
    this.preview.classList.add("raw-preview");

    this.refreshPreview();

    this.textarea.addEventListener("input", () => {
      this.data.html = this.textarea.value;
      this.refreshPreview();

      // Additional delayed refresh for async script initialization
      setTimeout(this.refreshPreview, 100);
    });

    this.wrapper.appendChild(this.textarea);
    this.wrapper.appendChild(this.preview);
    return this.wrapper;
  }

  save(blockContent) {
    return {
      html: this.textarea.value,
    };
  }
}

