import { useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { Badge, Input } from "../ui";
import { MAX_TAGS, MAX_TAG_LENGTH, useMediaTags } from "../../hooks/media";

/** Chips + one input: Enter or comma adds a tag, Backspace on an empty input removes the last one. Suggests tags already used in the library. */
export default function TagInput({ value, onChange }) {
    const [text, setText] = useState("");
    const { data: known = [] } = useMediaTags();
    const add = (raw) => {
        const next = [...value];
        for (const part of String(raw).split(",")) {
            const tag = part.trim().replace(/^#+/, "").replace(/\s+/g, " ").toLowerCase();
            if (!tag) continue;
            if (tag.length > MAX_TAG_LENGTH) { toast.error(`A tag can have at most ${MAX_TAG_LENGTH} characters`); continue; }
            if (next.length >= MAX_TAGS) { toast.error(`Up to ${MAX_TAGS} tags per image`); break; }
            if (!next.includes(tag)) next.push(tag);
        }
        onChange(next); setText("");
    };
    return (
        <div className="space-y-2">
            {value.length > 0 && (
                <ul className="flex flex-wrap gap-1.5">
                    {value.map((t) => (
                        <li key={t}>
                            <Badge tone="primary" className="gap-1 pl-2.5 pr-1">
                                #{t}
                                <button type="button" aria-label={`Remove tag ${t}`} onClick={() => onChange(value.filter((x) => x !== t))} className="grid size-4 place-items-center rounded-full hover:bg-black/10 focus-ring"><X className="size-3" /></button>
                            </Badge>
                        </li>
                    ))}
                </ul>
            )}
            <Input list="media-tag-suggestions" value={text} placeholder="Type a tag, then press Enter"
                onChange={(e) => (e.target.value.includes(",") ? add(e.target.value) : setText(e.target.value))}
                onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); if (text.trim()) add(text); }
                    else if (e.key === "Backspace" && !text && value.length) onChange(value.slice(0, -1));
                }}
                onBlur={() => text.trim() && add(text)} />
            <datalist id="media-tag-suggestions">{known.filter((k) => !value.includes(k.tag)).map((k) => <option key={k.tag} value={k.tag} />)}</datalist>
        </div>
    );
}