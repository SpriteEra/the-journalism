import React, { useEffect, useState } from "react";
import { Check, X as IoMdClose } from "lucide-react";
import { TrendingUp as FiTrendingUp } from "lucide-react";
import httpClient from '../../api/httpClient'

const TrendingTagsPopup = ({ isOpen, onClose, existingTags, onAddTags }) => {
    const [trendingTags, setTrendingTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        setError(null);
        setSelectedTags([]);

        httpClient
            .get("/trending-tags")
            .then(({ data }) => {
                setTrendingTags(data?.tags || data || []);
            })
            .catch(() => {
                setError("Failed to load trending tags. Please try again.");
            })
            .finally(() => setLoading(false));
    }, [isOpen]);

    const toggleTag = (tag) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const handleAdd = () => {
        onAddTags(selectedTags);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm px-4">
            <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-line">
                    <div className="flex items-center gap-2">
                        <FiTrendingUp className="text-warning" size={20} />
                        <h3 className="text-lg font-semibold text-fg">
                            Trending Tags
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-surface-2 transition-colors"
                    >
                        <IoMdClose size={20} className="text-fg-subtle" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-fg-subtle">
                                Loading trending tags...
                            </p>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="text-center py-10">
                            <p className="text-sm text-danger">{error}</p>
                        </div>
                    )}

                    {!loading && !error && (
                        <>
                            <p className="text-xs text-fg-faint mb-3">
                                Select tags to add to your news post
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {trendingTags.map((tag, i) => {
                                    const alreadyAdded = existingTags.includes(tag);
                                    const isSelected = selectedTags.includes(tag);

                                    return (
                                        <button
                                            key={i}
                                            disabled={alreadyAdded}
                                            onClick={() => !alreadyAdded && toggleTag(tag)}
                                            className={`
                        px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150
                        ${alreadyAdded
                                                    ? "bg-surface-2 text-fg-faint border-line cursor-not-allowed opacity-60"
                                                    : isSelected
                                                        ? "bg-primary text-paper border-primary shadow-sm scale-[1.02]"
                                                        : "bg-surface text-fg-muted border-line-strong hover:border-primary hover:text-primary"
                                                }
                      `}
                                        >
                                            {alreadyAdded && (
                                                <Check className="mr-1 size-3" />
                                            )}
                                            #{tag}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-line flex items-center justify-between gap-3">
                    <p className="text-sm text-fg-subtle">
                        {selectedTags.length > 0
                            ? `${selectedTags.length} tag${selectedTags.length > 1 ? "s" : ""} selected`
                            : "None selected"}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-fg-muted hover:bg-surface-2 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={selectedTags.length === 0}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-paper hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Add Tags
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrendingTagsPopup;