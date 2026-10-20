import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import "../../i18n";
import AdvancedPanel from "./AdvancedPanel";

const Host = ({ canFeature = true, current }) => {
  const [blog, setBlog] = useState({ seo: {}, layout: "standard", feature: { enabled: false, until: "" } });
  return <AdvancedPanel blog={blog} update={(p) => setBlog((b) => ({ ...b, ...p }))} title="शीर्षक" description="सार" canFeature={canFeature} currentFeatured={current} editingId="mine" />;
};

describe("AdvancedPanel", () => {
  it("SEO title shows in the search-result preview", () => {
    render(<Host />);
    fireEvent.click(screen.getByText("SEO"));
    fireEvent.change(screen.getByLabelText(/SEO title/), { target: { value: "मेरा एसईओ शीर्षक" } });
    expect(screen.getAllByText("मेरा एसईओ शीर्षक").length).toBeGreaterThan(0);
    expect(screen.queryByText("Design")).toBeNull();                         // the layout choice was removed from the form
  });
  it("featured: hidden without permission; with it asks for a time and warns about the live featured story", () => {
    const { unmount } = render(<Host canFeature={false} />);
    expect(screen.queryByText("Featured story")).toBeNull();
    unmount();
    render(<Host current={{ news_id: "other", title: "Current top story", until: new Date(Date.now() + 3600000).toISOString() }} />);
    fireEvent.click(screen.getByText("Featured story"));
    const toggle = document.querySelector('[role="switch"]');
    fireEvent.click(toggle);
    expect(screen.getByText("Keep it featured until")).toBeTruthy();
    expect(screen.getByText(/Current top story/)).toBeTruthy();         // the editor is told which story will be replaced
  });
});
