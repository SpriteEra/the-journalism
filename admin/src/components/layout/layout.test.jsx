import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import userReducer from "../../redux/slices/user.slice";
import ProtectedRoute from "../../utils/ProtectedRoute";
import Sidebar from "./Sidebar";
import Breadcrumbs from "./Breadcrumbs";
import Can from "./Can";

const storeFor = (user) => configureStore({ reducer: { user: userReducer }, preloadedState: { user: { user, loading: false, error: null, isAuthenticated: Boolean(user) } } });
const wrap = (user, ui, path = "/dashboard") => render(<Provider store={storeFor(user)}><MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter></Provider>);

const reporter = { id: "1", username: "ravi", role: "reporter", permissions: ["news.create", "news.view.own", "taxonomy.view", "tag.create"] };
const admin = { id: "2", username: "asha", role: "admin" };

describe("Sidebar", () => {
  it("lists only what the user may open and marks the current page", () => {
    wrap(reporter, <Sidebar collapsed={false} onToggleCollapse={() => {}} mobileOpen={false} onCloseMobile={() => {}} />, "/dashboard/news");
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(nav).toHaveTextContent("News");
    expect(nav).toHaveTextContent("Topics");
    expect(nav).not.toHaveTextContent("Roles & permissions");
    expect(nav).not.toHaveTextContent("Reporters");
    expect(screen.getByRole("link", { name: "News" })).toHaveAttribute("aria-current", "page");
  });
  it("shows the full menu to an admin and expands the Advertising group", async () => {
    wrap(admin, <Sidebar collapsed={false} onToggleCollapse={() => {}} mobileOpen={false} onCloseMobile={() => {}} />);
    expect(screen.getByRole("link", { name: "Roles & permissions" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Advertising/ }));
    expect(screen.getByRole("link", { name: "Banner ads" })).toHaveAttribute("href", "/dashboard/ads/banner-ads");
  });
  it("the mobile drawer renders only when opened", () => {
    const { rerender } = wrap(admin, <Sidebar collapsed={false} onToggleCollapse={() => {}} mobileOpen={false} onCloseMobile={() => {}} />);
    expect(screen.queryByRole("complementary", { name: "Menu" })).toBeNull();
    rerender(<Provider store={storeFor(admin)}><MemoryRouter><Sidebar collapsed={false} onToggleCollapse={() => {}} mobileOpen onCloseMobile={() => {}} /></MemoryRouter></Provider>);
    expect(screen.getByLabelText("Menu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();
  });
});

describe("ProtectedRoute", () => {
  const app = (user, perm) => wrap(user, (
    <Routes>
      <Route path="/login" element={<p>login page</p>} />
      <Route path="/dashboard" element={<p>dashboard</p>} />
      <Route path="/dashboard/roles" element={<ProtectedRoute component={() => <p>roles page</p>} permission={perm} />} />
    </Routes>
  ), "/dashboard/roles");
  it("sends anonymous users to login", () => { app(null, "role.view"); expect(screen.getByText("login page")).toBeInTheDocument(); });
  it("sends users without the permission back to the dashboard", () => { app(reporter, "role.view"); expect(screen.getByText("dashboard")).toBeInTheDocument(); });
  it("lets users with any of the listed permissions in (and admins always)", () => {
    app({ ...reporter, permissions: ["role.view"] }, ["role.view", "role.update"]); expect(screen.getByText("roles page")).toBeInTheDocument();
  });
  it("admin passes", () => { app(admin, "role.view"); expect(screen.getByText("roles page")).toBeInTheDocument(); });
});

describe("Breadcrumbs / Can", () => {
  it("uses sidebar labels for known pages and prettifies the rest", () => {
    wrap(admin, <Breadcrumbs />, "/dashboard/short-videos");
    expect(screen.getByText("Shorts & videos")).toHaveAttribute("aria-current", "page");
  });
  it("<Can> hides content without the permission and shows a fallback", () => {
    wrap(reporter, <><Can perm="news.create"><p>write</p></Can><Can perm="news.publish" fallback={<p>no publish</p>}><p>publish</p></Can></>);
    expect(screen.getByText("write")).toBeInTheDocument();
    expect(screen.queryByText("publish")).toBeNull();
    expect(screen.getByText("no publish")).toBeInTheDocument();
  });
});
