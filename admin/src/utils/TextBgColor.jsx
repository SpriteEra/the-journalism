const CLASS = "cdx-bg-color";

/*
  Standard palette: 10 hues x 5 shades (light -> dark).
  Columns: gray, red, orange, yellow, green, cyan, blue, purple, pink, brown
*/
const PALETTE = [
    // very light
    ["#F5F5F5", "#FFCDD2", "#FFE0B2", "#FFF9C4", "#C8E6C9", "#B2EBF2", "#BBDEFB", "#E1BEE7", "#F8BBD0", "#D7CCC8"],
    // light
    ["#E0E0E0", "#EF9A9A", "#FFCC80", "#FFF176", "#A5D6A7", "#80DEEA", "#90CAF9", "#CE93D8", "#F48FB1", "#BCAAA4"],
    // base
    ["#9E9E9E", "#F44336", "#FF9800", "#FFEB3B", "#4CAF50", "#00BCD4", "#2196F3", "#9C27B0", "#E91E63", "#795548"],
    // dark
    ["#616161", "#D32F2F", "#F57C00", "#FBC02D", "#388E3C", "#0097A7", "#1976D2", "#7B1FA2", "#C2185B", "#5D4037"],
    // very dark
    ["#212121", "#B71C1C", "#E65100", "#F9A825", "#1B5E20", "#006064", "#0D47A1", "#4A148C", "#880E4F", "#3E2723"],
];

const PALETTE_WIDTH = 274;

// white text on dark backgrounds, normal text on light ones
const textFor = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return brightness < 0.55 ? "#ffffff" : "inherit";
};

const ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg>`;

export default class TextBgColor {
    static get isInline() {
        return true;
    }

    static get title() {
        return "Text background color";
    }

    // keep <mark style="background-color:..."> when Editor.js sanitizes the HTML
    static get sanitize() {
        return { mark: { class: true, style: true } };
    }

    constructor({ api }) {
        this.api = api;
        this.button = null;
        this.palette = null;
        this.savedRange = null;
        this.onOutside = this.onOutside.bind(this);
        this.onKey = this.onKey.bind(this);
    }

    render() {
        this.button = document.createElement("button");
        this.button.type = "button";
        this.button.innerHTML = ICON;
        this.button.classList.add(this.api.styles.inlineToolButton);
        return this.button;
    }

    /* ---------- palette (floating, appended to <body>) ---------- */

    buildPalette() {
        const box = document.createElement("div");
        Object.assign(box.style, {
            position: "fixed",
            zIndex: "100000",
            display: "grid",
            gridTemplateColumns: "repeat(10, 22px)",
            gap: "4px",
            padding: "8px",
            width: `${PALETTE_WIDTH}px`,
            boxSizing: "border-box",
            background: "#fff",
            border: "1px solid #e4e4e7",
            borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(0,0,0,.18)",
        });

        PALETTE.flat().forEach((c) => box.appendChild(this.swatch(c)));
        box.appendChild(this.removeButton());

        // never steal the text selection
        box.addEventListener("mousedown", (e) => e.preventDefault());
        return box;
    }

    swatch(color) {
        const el = document.createElement("button");
        el.type = "button";
        el.title = color;
        Object.assign(el.style, {
            width: "22px",
            height: "22px",
            borderRadius: "4px",
            border: "1px solid rgba(0,0,0,.12)",
            cursor: "pointer",
            background: color,
            padding: "0",
            transition: "transform .1s",
        });
        el.addEventListener("mouseenter", () => (el.style.transform = "scale(1.15)"));
        el.addEventListener("mouseleave", () => (el.style.transform = "scale(1)"));
        el.addEventListener("click", () => this.apply(color));
        return el;
    }

    removeButton() {
        const el = document.createElement("button");
        el.type = "button";
        el.textContent = "No background";
        Object.assign(el.style, {
            gridColumn: "1 / -1",
            marginTop: "4px",
            padding: "5px 8px",
            fontSize: "12px",
            color: "#52525b",
            background: "#f4f4f5",
            border: "1px solid #e4e4e7",
            borderRadius: "6px",
            cursor: "pointer",
        });
        el.addEventListener("click", () => this.apply(null));
        return el;
    }

    open() {
        if (!this.button) return;
        this.close();
        this.palette = this.buildPalette();
        document.body.appendChild(this.palette);

        const r = this.button.getBoundingClientRect();
        const left = Math.min(Math.max(8, r.left), window.innerWidth - PALETTE_WIDTH - 8);
        this.palette.style.left = `${left}px`;
        this.palette.style.top = `${r.bottom + 8}px`;

        document.addEventListener("mousedown", this.onOutside, true);
        document.addEventListener("keydown", this.onKey, true);
    }

    close() {
        if (this.palette) {
            this.palette.remove();
            this.palette = null;
        }
        document.removeEventListener("mousedown", this.onOutside, true);
        document.removeEventListener("keydown", this.onKey, true);
    }

    onOutside(e) {
        if (this.palette?.contains(e.target) || this.button?.contains(e.target)) return;
        this.close();
    }

    onKey(e) {
        if (e.key === "Escape") this.close();
    }

    /* ---------- Editor.js inline-tool hooks ---------- */

    // toolbar button click
    surround() {
        if (this.palette) return this.close();

        const sel = window.getSelection();
        this.savedRange = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
        this.open();
    }

    // Editor.js calls this when the inline toolbar closes
    clear() {
        this.close();
    }

    checkState() {
        const mark = this.api.selection.findParentTag("MARK", CLASS);
        this.button?.classList.toggle(this.api.styles.inlineToolButtonActive, !!mark);
        return !!mark;
    }

    /* ---------- apply / remove highlight ---------- */

    apply(color) {
        const selection = window.getSelection();

        // restore the selection in case it was lost
        if (this.savedRange && (!selection.rangeCount || selection.isCollapsed)) {
            selection.removeAllRanges();
            selection.addRange(this.savedRange);
        }
        if (!selection.rangeCount) return this.close();

        const range = selection.getRangeAt(0);
        const existing = this.api.selection.findParentTag("MARK", CLASS);

        if (existing) {
            if (color) {
                existing.style.backgroundColor = color;
                existing.style.color = textFor(color);
            } else {
                this.unwrap(existing);
            }
        } else if (color && !range.collapsed) {
            const fragment = range.extractContents();
            // drop highlights nested in the selection so colors don't stack
            fragment.querySelectorAll(`mark.${CLASS}`).forEach((m) => this.unwrap(m));

            const mark = document.createElement("mark");
            mark.className = CLASS;
            mark.style.backgroundColor = color;
            mark.style.color = textFor(color);
            mark.appendChild(fragment);
            range.insertNode(mark);

            this.api.selection.expandToTag(mark);
        }

        this.close();
    }

    unwrap(mark) {
        const parent = mark.parentNode;
        while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
        parent.removeChild(mark);
        parent.normalize();
    }
}