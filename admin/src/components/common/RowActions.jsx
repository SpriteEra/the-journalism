import { Share2 } from "lucide-react";
import { IconButton } from "../ui";
import { shareLink } from "../../lib/share";
import RowMenu from "./RowMenu";

const resolve = (v, row) => (typeof v === "function" ? v(row) : v);

/**
 * <RowActions row actions share={{ url, title }} />
 *  - share icon stays in the row (native share sheet, or copies the link)
 *  - actions (History, Edit, Delete, Approve ...) go in the three-dot menu
 *  - an action with inline: true is shown as its own icon in the row instead
 */
export default function RowActions({ row, actions = [], share }) {
    const visible = actions.filter((a) => a && !resolve(a.hidden, row));
    const inline = visible.filter((a) => a.inline);
    const menu = visible.filter((a) => !a.inline).map((a) => ({ ...a, onClick: () => a.onClick(row) }));

    return (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            {share && (
                <IconButton
                    size="icon-sm"
                    label="Share"
                    onClick={() => shareLink({ title: resolve(share.title, row), url: resolve(share.url, row) })}
                >
                    <Share2 className="size-4" />
                </IconButton>
            )}
            {inline.map(({ label, icon: Icon, onClick, danger }) => (
                <IconButton
                    key={label}
                    size="icon-sm"
                    label={label}
                    className={danger ? "text-danger hover:bg-danger-soft" : undefined}
                    onClick={() => onClick(row)}
                >
                    {Icon && <Icon className="size-4" />}
                </IconButton>
            ))}
            <RowMenu items={menu} />
        </div>
    );
}