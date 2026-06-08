/**
 * api/tickets.js — Ticket API Calls
 *
 * Wraps the generic client with ticket-specific operations.
 * The rest of the app calls these functions instead of fetch directly.
 *
 * json-server endpoints (already supported, no backend code needed):
 *   GET    /tickets                              — list all
 *   GET    /tickets?status=open&priority=urgent  — filter (any field)
 *   GET    /tickets?_sort=createdAt&_order=desc  — sort
 *   GET    /tickets?_page=1&_limit=10            — paginate
 *                  (response also has X-Total-Count header — useful!)
 *   GET    /tickets?q=login                      — full-text search
 *   GET    /tickets/:id                          — single
 *   POST   /tickets                              — create (json-server auto-assigns id)
 *   PATCH  /tickets/:id                          — partial update (only changed fields)
 *   DELETE /tickets/:id                          — delete
 *
 *   GET    /comments?ticketId=:id                — comments for a ticket
 *   POST   /comments                             — add a comment
 *
 * TODO:
 *   [ ] listTickets(opts) — opts = { status, priority, search, sort, order, page, limit }
 *       Build a query string, call get(), return { items, total }
 *   [ ] getTicket(id)
 *   [ ] createTicket(data) — set createdAt/updatedAt to new Date().toISOString()
 *   [ ] updateTicket(id, patch) — also bump updatedAt
 *   [ ] deleteTicket(id)
 *   [ ] listComments(ticketId)
 *   [ ] addComment({ ticketId, authorId, content })
 */



// export async function listTickets(opts = {}) {
//   // TODO
// }

// export async function getTicket(id) { /* TODO */ }
// export async function createTicket(data) { /* TODO */ }
// export async function updateTicket(id, patch) { /* TODO */ }
// export async function deleteTicket(id) { /* TODO */ }
// export async function listComments(ticketId) { /* TODO */ }
// export async function addComment(comment) { /* TODO */ }


/**
 * api/tickets.js — Ticket API calls (json-server)
 */

import { get, post, patch as httpPatch, del, getWithTotal } from "./client.js";


export function buildQueryString(state = {}) {
  const params = new URLSearchParams();

  const status =
    typeof state.status === "string" ? state.status.trim() : state.status;
  if (status) params.set("status", status);

  const priority =
    typeof state.priority === "string"
      ? state.priority.trim()
      : state.priority;
  if (priority) params.set("priority", priority);

  const assignee = state.assignee;
  if (assignee !== undefined && assignee !== null && assignee !== "") {
    params.set("assignedTo", String(assignee));
  }

  const rawSearch = state.search;
  const q =
    rawSearch == null ? "" : String(rawSearch).trim();
  if (q) params.set("q", q);

  const sort = state.sort ?? state.sortBy ?? "createdAt";
  const order = state.order ?? "desc";
  if (sort) params.set("_sort", sort);
  if (order) params.set("_order", order);

  const { page, limit } = state;
  if (page != null) params.set("_page", String(page));
  if (limit != null) params.set("_limit", String(limit));

  return params.toString();
}

function buildTicketsPath(state = {}) {
  const qs = buildQueryString(state);
  return qs ? `/tickets?${qs}` : "/tickets";
}



export async function listTickets(opts = {}) {
  const path = buildTicketsPath(opts);
  const paginated =
    opts.page != null && opts.limit != null && opts.page > 0 && opts.limit > 0;

  if (paginated) {
    return getWithTotal(path);
  }

  const items = await get(path);
  const total = Array.isArray(items) ? items.length : 0;
  return { items, total };
}

export async function getTicket(id) {
  return get(`/tickets/${encodeURIComponent(id)}`);
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
  return get(`/comments?ticketId=${encodeURIComponent(ticketId)}`);
}


export async function addComment(comment) {
  const body = {
    ...comment,
    createdAt: new Date().toISOString(),
  };
  return post("/comments", body);
}