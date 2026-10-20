import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { useState } from "react";
import userReducer from "../redux/slices/user.slice";
import "../i18n";
import { ConfirmProvider } from "./ui/ConfirmProvider";

vi.mock("../api/httpClient", () => ({ default: { get: vi.fn(async () => ({ data: {} })), post: vi.fn(async () => ({ data: {} })) } }));
vi.mock("../hooks/admin", async (orig) => ({ ...(await orig()), useCategories: () => ({ data: [{ _id: "c1", name: "Politics", slug: "politics" }] }), useStates: () => ({ data: [{ _id: "s1", state: "up", displayName: "Uttar Pradesh", slug: "uttar-pradesh" }] }), useDistricts: () => ({ data: [] }), useTaxonomy: () => ({ data: [] }) }));
vi.mock("./taxonomy/TaxonomyFields.jsx", () => ({ TaxonomyFields: () => <div>taxonomy</div>, TagPicker: ({ label }) => <div>{label} picker</div> }));
vi.mock("./keywords/Aitagspopup.jsx", () => ({ default: () => null }));

const admin = { id: "u1", username: "asha", role: "admin", fullName: "Asha" };

describe("PublishForm (story details step)", () => {
  it("shows topic + Hindi/English keywords, a checklist, and opens the full-screen preview", async () => {
    const { EditorContext } = await import("../pages/news/CreateNews.jsx");
    const PublishForm = (await import("./PublishForm.jsx")).default;
    const Host = () => {
      const [blog, setBlog] = useState({ title: "मोदी की रैली", banner: "https://x/y.jpg", description: "सार", content: [{ blocks: [{ type: "paragraph", data: { text: "खबर का पाठ" } }] }], tags: [], keywords: { hi: [], en: [] }, category: ["c1"], subCategory: [], state: ["s1"], district: [], aiGeneratedTags: [], sendNotification: false });
      return (
        <EditorContext.Provider value={{ blog, setBlog, setEditorState: () => {}, setHasChanges: () => {}, setTextEditor: () => {} }}>
          <PublishForm />
        </EditorContext.Provider>
      );
    };
    render(
      <Provider store={configureStore({ reducer: { user: userReducer }, preloadedState: { user: { user: admin, loading: false, error: null, isAuthenticated: true } } })}>
        <QueryClientProvider client={new QueryClient()}><ConfirmProvider><MemoryRouter><Host /></MemoryRouter></ConfirmProvider></QueryClientProvider>
      </Provider>
    );
    expect(screen.getByText("Topic picker")).toBeTruthy();
    expect(screen.getByText("At least one SEO keyword")).toBeTruthy();    // checklist item is still open

    // two sections chosen -> the editor marks ONE as primary; the link preview follows it
    const group = screen.getByRole("radiogroup", { name: /Primary section/ });
    expect(group).toBeTruthy();
    expect(document.body.textContent).toContain("/politics/news/");
    fireEvent.click(screen.getByRole("radio", { name: /Uttar Pradesh/ }));
    expect(document.body.textContent).toContain("/uttar-pradesh/news/");
    expect(screen.getByRole("button", { name: /Save as draft/ })).toBeTruthy();
    expect(screen.queryByText("Image credit")).toBeNull();

    // add one Hindi and one English keyword -> the checklist item turns done
    const box = screen.getByPlaceholderText(/Type a keyword in Hindi or English/);
    fireEvent.change(box, { target: { value: "मोदी, चुनाव" } }); fireEvent.keyDown(box, { key: "Enter" });   // ONE keyword: a comma does not split
    expect(screen.getByText("मोदी, चुनाव")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: /Full preview|Preview/ })[0]);
    expect(await screen.findByRole("dialog", { name: "Full preview" })).toBeTruthy();
    expect(screen.getAllByText("मोदी की रैली").length).toBeGreaterThan(0);
    expect(screen.getByText("खबर का पाठ")).toBeTruthy();
  });
});
