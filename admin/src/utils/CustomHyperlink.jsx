export default class CustomHyperlink {
  static get isInline() {
    return true;
  }

  static get title() {
    return "Link";
  }

  static get shortcut() {
    return "CMD+L";
  }

  
static get sanitize() {
  return {
    a: {
      href: true,
      target: true,
      rel: true,
      class: true,
    },
  };
}

  constructor({ api }) {
    this.api = api;
    this.tag = "A";
    this.class = "cdx-custom-link";
    this.input = null;
    this.inputWrapper = null;
  }

  /**
   * Render toolbar button
   */
  render() {
    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" 
           fill="none" xmlns="http://www.w3.org/2000/svg"
           stroke="currentColor" stroke-width="2" 
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 17h6l3-3v-4"/>
        <path d="M15 7H9l-3 3v4"/>
        <path d="m9 12 6 0"/>
      </svg>
    `;

    this.button.classList.add(this.api.styles.inlineToolButton);
    return this.button;
  }

  /**
   * Called when clicking the link button
   */
  surround(range) {
    if (!range) return;

    const existingLink = this.api.selection.findParentTag(this.tag, this.class);

    if (existingLink) {
      // Toggle link off
      const textNode = document.createTextNode(existingLink.textContent);
      existingLink.replaceWith(textNode);
      this.removeInput();
      return;
    }

    // Show floating input near the selection
    this.showInput(range);
  }

  /**
   * Create floating input for URL
   */
  showInput(range) {
    this.removeInput(); // Clean up if any existing input

    this.inputWrapper = document.createElement("div");
    this.inputWrapper.style.position = "absolute";
    this.inputWrapper.style.background = "#fff";
    this.inputWrapper.style.border = "1px solid #ddd";
    this.inputWrapper.style.padding = "6px 8px";
    this.inputWrapper.style.borderRadius = "6px";
    this.inputWrapper.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
    this.inputWrapper.style.zIndex = "9999";

    // Create the input field
    this.input = document.createElement("input");
    this.input.type = "text";
    this.input.placeholder = "Add a link";
    this.input.style.border = "none";
    this.input.style.outline = "none";
    this.input.style.width = "180px";
    this.input.style.fontSize = "14px";

    this.inputWrapper.appendChild(this.input);
    document.body.appendChild(this.inputWrapper);

    // Position the input below the selected range
    const rect = range.getBoundingClientRect();
    this.inputWrapper.style.top = `${rect.bottom + window.scrollY + 5}px`;
    this.inputWrapper.style.left = `${rect.left + window.scrollX}px`;

    // Focus the input
    this.input.focus();

    // Handle pressing Enter
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const url = this.input.value.trim();
        if (url) {
          this.applyLink(range, url);
        }
        this.removeInput();
      }
      if (e.key === "Escape") {
        this.removeInput();
      }
    });

    // Clicking outside closes the input
    const outsideClickHandler = (e) => {
      if (this.inputWrapper && !this.inputWrapper.contains(e.target)) {
        this.removeInput();
        document.removeEventListener("mousedown", outsideClickHandler);
      }
    };
    document.addEventListener("mousedown", outsideClickHandler);
  }

  /**
   * Apply the link without removing bold or italic
   */
  applyLink(range, url) {
    const selectedText = range.extractContents();

    const anchor = document.createElement(this.tag);
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.classList.add(this.class);

    anchor.appendChild(selectedText);
    range.insertNode(anchor);
  }

  /**
   * Remove the floating input
   */
  removeInput() {
    if (this.inputWrapper) {
      this.inputWrapper.remove();
      this.inputWrapper = null;
      this.input = null;
    }
  }

  /**
   * Check if selection is inside a link
   */
  checkState(selection) {
    const anchor = this.api.selection.findParentTag(this.tag, this.class);
    this.button.classList.toggle(
      this.api.styles.inlineToolButtonActive,
      !!anchor
    );
  }
}
