import {
  get,
  post,
  patch as httpPatch,
  del,
} from "./client.js";

/**
 * Build query string for json-server 1.x (see node_modules/json-server README).
 * Uses _sort (prefix "-" for desc), _page, _per_page — not _order/_limit/q.
 */
export function buildQueryString(state = {}) {
  const params = new URLSearchParams();

  const status =
    typeof state.status === "string" ? state.status.trim() : state.status;
  const priority =
    typeof state.priority === "string"
      ? state.priority.trim()
      : state.priority;
  const assignee = state.assignee;

  const rawSearch = state.search;
  const term =
    rawSearch == null ? "" : String(rawSearch).trim();

  if (term) {
    const where = {};
    if (status) where.status = { eq: status };
    if (priority) where.priority = { eq: priority };
    if (assignee !== undefined && assignee !== null && assignee !== "") {
      const n = Number(assignee);
      where.assignedTo = { eq: Number.isFinite(n) ? n : assignee };
    }
    where.or = [
      { title: { contains: term } },
      { description: { contains: term } },
      { customerName: { contains: term } },
      { customerEmail: { contains: term } },
    ];
    params.set("_where", JSON.stringify(where));
  } else {
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (assignee !== undefined && assignee !== null && assignee !== "") {
      params.set("assignedTo", String(assignee));
    }
  }

  const sortField = state.sort ?? state.sortBy ?? "createdAt";
  const order = state.order ?? "desc";
  params.set("_sort", order === "desc" ? `-${sortField}` : sortField);

  const page = state.page ?? 1;
  const limit = state.limit ?? 10;
  params.set("_page", String(page));
  params.set("_per_page", String(limit));

  return params.toString();
}

export async function listTickets(state = {}) {
  const query = new URLSearchParams(buildQueryString(state));
  return get(`/tickets?${query.toString()}`);
}

export async function getTicket(id) {
  const { data } = await get(`/tickets/${encodeURIComponent(id)}`);
  return data;
}

export async function createTicket(data) {
  const now = new Date().toISOString();
  const body = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  return post("/tickets", body);
}

export async function updateTicket(id, patch) {
  const body = {
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  return httpPatch(`/tickets/${encodeURIComponent(id)}`, body);
}

export async function deleteTicket(id) {
  return del(`/tickets/${encodeURIComponent(id)}`);
}

export async function listComments(ticketId) {
  const { data } = await get(`/comments?ticketId=${encodeURIComponent(ticketId)}`);
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

export async function addComment(comment) {
  const body = {
    ...comment,
    createdAt: new Date().toISOString(),
  };
  return post("/comments", body);
}
