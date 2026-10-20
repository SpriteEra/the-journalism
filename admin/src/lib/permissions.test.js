import { describe, expect, it } from "vitest";
import { can, canAny, isSuper } from "./permissions";
import { visibleNav } from "../components/layout/navConfig";

const reporter = { role: "reporter", permissions: ["news.create", "news.view.own", "taxonomy.view", "tag.create"] };
const admin = { role: "admin" };
const desk = { role: "desk-editor", permissions: ["news.*", "analytics.view"] };

describe("permissions", () => {
  it("admin / isSuper can do everything, nobody can do anything when logged out", () => {
    expect(isSuper(admin)).toBe(true);
    expect(isSuper({ role: "x", isSuper: true })).toBe(true);
    expect(can(admin, "role.delete")).toBe(true);
    expect(can(null, "news.create")).toBe(false);
    expect(canAny(undefined, ["a"])).toBe(false);
  });
  it("exact keys, array = all of them, canAny = at least one", () => {
    expect(can(reporter, "news.create")).toBe(true);
    expect(can(reporter, "news.publish")).toBe(false);
    expect(can(reporter, ["news.create", "tag.create"])).toBe(true);
    expect(can(reporter, ["news.create", "news.publish"])).toBe(false);
    expect(canAny(reporter, ["news.publish", "taxonomy.view"])).toBe(true);
    expect(canAny(reporter, ["news.publish", "role.view"])).toBe(false);
  });
  it("group wildcards (news.*) work but do not leak into other modules", () => {
    expect(can(desk, "news.approve")).toBe(true);
    expect(can(desk, "news.update.any")).toBe(true);
    expect(can(desk, "newsletter.send")).toBe(false);
    expect(can(desk, "user.view")).toBe(false);
  });
});

describe("sidebar visibility", () => {
  const labels = (u) => visibleNav((perms) => canAny(u, perms)).flatMap((s) => s.items.map((i) => i.label));
  it("a reporter sees newsroom basics only", () => {
    const l = labels(reporter);
    expect(l).toContain("News"); expect(l).toContain("Topics"); expect(l).toContain("My profile");
    expect(l).not.toContain("Roles & permissions"); expect(l).not.toContain("Reporters"); expect(l).not.toContain("Review queue");
  });
  it("an admin sees everything, and empty sections are dropped", () => {
    const l = labels(admin);
    ["Overview", "Review queue", "Shorts & videos", "Roles & permissions", "Reporters", "Analytics", "Advertising"].forEach((x) => expect(l).toContain(x));
    const sections = visibleNav(() => false);
    expect(sections.flatMap((s) => s.items.map((i) => i.label))).toEqual(["My profile"]);   // only items without a permission remain
  });
  it("a custom role with a few permissions gets exactly those pages", () => {
    const l = labels(desk);
    expect(l).toContain("Review queue"); expect(l).toContain("Overview"); expect(l).not.toContain("Reporters");
  });
});
