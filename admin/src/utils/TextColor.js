const CLASS = "cdx-text-color";

/* Row 1: white -> black. Then 4 shades of 10 hues. */
const PALETTE = [
    ["#FFFFFF", "#F5F5F5", "#E0E0E0", "#9E9E9E", "#616161", "#212121", "#000000"],
    ["#EF9A9A", "#FFCC80", "#FFF176", "#A5D6A7", "#80DEEA", "#90CAF9", "#CE93D8", "#F48FB1", "#BCAAA4"],
    ["#F44336", "#FF9800", "#FFEB3B", "#4CAF50", "#00BCD4", "#2196F3", "#9C27B0", "#E91E63", "#795548"],
    ["#D32F2F", "#F57C00", "#FBC02D", "#388E3C", "#0097A7", "#1976D2", "#7B1FA2", "#C2185B", "#5D4037"],
    ["#B71C1C", "#E65100", "#F9A825", "#1B5E20", "#006064", "#0D47A1", "#4A148C", "#880E4F", "#3E2723"],
];

const COLS = 9;
const SWATCH = 22;
const GAP = 4;
const PAD = 8;
const PALETTE_WIDTH = COLS * SWATCH + (COLS - 1) * GAP + PAD * 2 + 2;

const ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16"/><path d="m6 16 6-12 6 12"/><path d="M8 12h8"/></svg>`;

export default class TextColor {
    static get isInline() {
        return true;
    }

    static get title() {
        return "Text color";
    }

    // keep <span class="cdx-text-color" style="color:..."> when Editor.js sanitizes the HTML
    static get sanitize() {
        return { span: { class: true, style: true } };
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

    buildPalette() {
        const box = document.createElement("div");
        Object.assign(box.style, {
            position: "fixed",
            zIndex: "100000",
            display: "grid",
            gridTemplateColumns: `repeat(${COLS}, ${SWATCH}px)`,
            gap: `${GAP}px`,
            padding: `${PAD}px`,
            width: `${PALETTE_WIDTH}px`,
            boxSizing: "border-box",
            background: "#fff",
            border: "1px solid #e4e4e7",
            borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(0,0,0,.18)",
        });

        PALETTE.forEach((row, i) => {
            row.forEach((c) => box.appendChild(this.swatch(c)));
            // fill the unused cells of the first (shorter) row
            if (i === 0) for (let k = row.length; k < COLS; k++) box.appendChild(document.createElement("span"));
        });
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
            width: `${SWATCH}px`,
            height: `${SWATCH}px`,
            borderRadius: "4px",
            border: "1px solid rgba(0,0,0,.2)",
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
        el.textContent = "Default color";
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

    surround() {
        if (this.palette) return this.close();
        const sel = window.getSelection();
        this.savedRange = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
        this.open();
    }

    clear() {
        this.close();
    }

    checkState() {
        const span = this.api.selection.findParentTag("SPAN", CLASS);
        this.button?.classList.toggle(this.api.styles.inlineToolButtonActive, !!span);
        return !!span;
    }

    apply(color) {
        const selection = window.getSelection();

        if (this.savedRange && (!selection.rangeCount || selection.isCollapsed)) {
            selection.removeAllRanges();
            selection.addRange(this.savedRange);
        }
        if (!selection.rangeCount) return this.close();

        const range = selection.getRangeAt(0);
        const existing = this.api.selection.findParentTag("SPAN", CLASS);

        if (existing) {
            if (color) existing.style.color = color;
            else this.unwrap(existing);
        } else if (color && !range.collapsed) {
            const fragment = range.extractContents();
            // drop colors nested in the selection so they don't stack
            fragment.querySelectorAll(`span.${CLASS}`).forEach((s) => this.unwrap(s));

            const span = document.createElement("span");
            span.className = CLASS;
            span.style.color = color;
            span.appendChild(fragment);
            range.insertNode(span);

            this.api.selection.expandToTag(span);
        }

        this.close();
    }

    unwrap(el) {
        const parent = el.parentNode;
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
        parent.normalize();
    }
}