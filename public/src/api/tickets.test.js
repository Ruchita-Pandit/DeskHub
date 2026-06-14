import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./client.js", () => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
}));

import {
  buildQueryString,
  listTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  listComments,
  addComment,
} from "./tickets.js";
import { get, post, patch, del } from "./client.js";

describe("tickets — buildQueryString (json-server 1.x)", () => {
  it("defaults sort desc, page, and per_page", () => {
    const qs = buildQueryString({});
    expect(qs).toBe("_sort=-createdAt&_page=1&_per_page=10");
  });

  it("includes trimmed status and priority as plain params when no search", () => {
    const qs = buildQueryString({
      status: "  open  ",
      priority: " urgent ",
      page: 1,
      limit: 10,
    });
    expect(qs).toContain("status=open");
    expect(qs).toContain("priority=urgent");
    expect(qs).toContain("_per_page=10");
  });

  it("omits status when empty after trim", () => {
    const qs = buildQueryString({ status: "   ", page: 1, limit: 10 });
    expect(qs).not.toContain("status=");
  });

  it("includes assignedTo when assignee is set", () => {
    expect(buildQueryString({ assignee: 3, page: 1, limit: 10 })).toContain(
      "assignedTo=3"
    );
    expect(buildQueryString({ assignee: "7", page: 1, limit: 10 })).toContain(
      "assignedTo=7"
    );
  });

  it("omits assignedTo when assignee is null, undefined, or empty string", () => {
    expect(buildQueryString({ assignee: null, page: 1, limit: 10 })).not.toContain(
      "assignedTo"
    );
    expect(
      buildQueryString({ assignee: undefined, page: 1, limit: 10 })
    ).not.toContain("assignedTo");
    expect(buildQueryString({ assignee: "", page: 1, limit: 10 })).not.toContain(
      "assignedTo"
    );
  });

  it("uses _where with contains when search is set", () => {
    const qs = buildQueryString({ search: " login ", page: 1, limit: 10 });
    expect(qs).toContain("_where=");
    expect(decodeURIComponent(qs)).toContain("login");
    expect(qs).not.toContain("q=");
  });

  it("uses ascending sort when order is asc", () => {
    const qs = buildQueryString({
      sortBy: "title",
      order: "asc",
      page: 1,
      limit: 10,
    });
    expect(qs).toContain("_sort=title");
    expect(qs).not.toContain("_order=");
  });

  it("includes page and per_page", () => {
    const qs = buildQueryString({ page: 2, limit: 20 });
    expect(qs).toContain("_page=2");
    expect(qs).toContain("_per_page=20");
    expect(qs).not.toContain("_limit=");
  });
});

describe("tickets — API wrappers (mocked client)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listTickets returns get() result with data and headers", async () => {
    const headers = new Headers({ "X-Total-Count": "99" });
    get.mockResolvedValue({ data: [{ id: 1 }], headers });
    const result = await listTickets({
      page: 1,
      limit: 10,
      status: "open",
    });
    expect(get).toHaveBeenCalledTimes(1);
    const path = get.mock.calls[0][0];
    expect(path).toMatch(/^\/tickets\?/);
    expect(path).toContain("status=open");
    expect(path).toContain("_page=1");
    expect(path).toContain("_per_page=10");
    expect(result.data).toEqual([{ id: 1 }]);
    expect(result.headers.get("X-Total-Count")).toBe("99");
  });

  it("listTickets builds default query string", async () => {
    const headers = new Headers({ "X-Total-Count": "0" });
    get.mockResolvedValue({ data: [], headers });
    await listTickets({});
    expect(get).toHaveBeenCalledWith(
      "/tickets?_sort=-createdAt&_page=1&_per_page=10"
    );
  });

  it("listTickets still calls get when page is 0", async () => {
    const headers = new Headers();
    get.mockResolvedValue({ data: [], headers });
    await listTickets({ page: 0, limit: 10 });
    expect(get).toHaveBeenCalled();
    const path = get.mock.calls[0][0];
    expect(path).toContain("_page=0");
  });

  it("getTicket calls get with encoded id and returns JSON body", async () => {
    get.mockResolvedValue({ data: { id: "a/b" }, headers: new Headers() });
    const ticket = await getTicket("a/b");
    expect(get).toHaveBeenCalledWith("/tickets/a%2Fb");
    expect(ticket).toEqual({ id: "a/b" });
  });

  it("createTicket posts merged body with timestamps", async () => {
    post.mockResolvedValue({ id: 1 });
    const iso = "2020-01-01T00:00:00.000Z";
    const spy = vi.spyOn(Date.prototype, "toISOString").mockReturnValue(iso);
    try {
      await createTicket({ title: "Hi" });
    } finally {
      spy.mockRestore();
    }
    expect(post).toHaveBeenCalledWith(
      "/tickets",
      expect.objectContaining({
        title: "Hi",
        createdAt: iso,
        updatedAt: iso,
      })
    );
  });

  it("updateTicket patches with encoded id and updatedAt", async () => {
    patch.mockResolvedValue({ id: 2 });
    const iso = "2020-06-01T12:00:00.000Z";
    const spy = vi.spyOn(Date.prototype, "toISOString").mockReturnValue(iso);
    try {
      await updateTicket("2", { status: "closed" });
    } finally {
      spy.mockRestore();
    }
    expect(patch).toHaveBeenCalledWith(
      "/tickets/2",
      expect.objectContaining({ status: "closed", updatedAt: iso })
    );
  });

  it("deleteTicket calls del with encoded id", async () => {
    del.mockResolvedValue(undefined);
    await deleteTicket("x y");
    expect(del).toHaveBeenCalledWith("/tickets/x%20y");
  });

  it("listComments calls get with ticketId query", async () => {
    get.mockResolvedValue({ data: [], headers: new Headers() });
    await listComments("5");
    expect(get).toHaveBeenCalledWith("/comments?ticketId=5");
  });

  it("addComment posts body with createdAt", async () => {
    post.mockResolvedValue({ id: 9 });
    const iso = "2021-01-01T00:00:00.000Z";
    const spy = vi.spyOn(Date.prototype, "toISOString").mockReturnValue(iso);
    try {
      await addComment({ ticketId: 1, content: "ok" });
    } finally {
      spy.mockRestore();
    }
    expect(post).toHaveBeenCalledWith(
      "/comments",
      expect.objectContaining({
        ticketId: 1,
        content: "ok",
        createdAt: iso,
      })
    );
  });
});
