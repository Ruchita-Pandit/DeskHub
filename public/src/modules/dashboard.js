import { listTickets } from "../api/tickets.js";
import { initLogout } from "./auth.js";
import { formatDate } from "../utils/formatDate.js";

function showUserWelcome() {
  try {
    const raw = localStorage.getItem("deskhub:user");
    const user = raw ? JSON.parse(raw) : {};
    const el = document.getElementById("user-welcome");
    if (el && user?.name) {
      el.textContent = `Welcome back, ${user.name}! (${user.role ?? "user"})`;
    }
  } catch {
    /* ignore */
  }
}

function setStatText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(value);
}

async function loadTicketStats() {
  const [all, open, inProgress, resolved] = await Promise.all([
    listTickets({ page: 1, limit: 1 }),
    listTickets({ status: "open", page: 1, limit: 1 }),
    listTickets({ status: "in-progress", page: 1, limit: 1 }),
    listTickets({ status: "resolved", page: 1, limit: 1 }),
  ]);

  setStatText("stat-total", all.total ?? 0);
  setStatText("stat-open", open.total ?? 0);
  setStatText("stat-in-progress", inProgress.total ?? 0);
  setStatText("stat-resolved", resolved.total ?? 0);
}

function renderRecentTickets(tickets) {
  const ul = document.getElementById("dashboard-recent-list");
  const empty = document.getElementById("dashboard-recent-empty");
  if (!ul) return;

  ul.replaceChildren();

  if (!Array.isArray(tickets) || tickets.length === 0) {
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;

  for (const t of tickets) {
    const li = document.createElement("li");
    li.className = "dashboard-recent-item";

    const a = document.createElement("a");
    a.className = "dashboard-recent-link";
    a.href = `ticket-detail.html?id=${encodeURIComponent(t.id)}`;

    const title = document.createElement("span");
    title.className = "dashboard-recent-title";
    title.textContent = t.title ?? `Ticket #${t.id}`;

    const meta = document.createElement("span");
    meta.className = "dashboard-recent-meta";
    const created = t.createdAt ? formatDate(t.createdAt) : "—";
    meta.textContent = `${t.status ?? "—"} · ${created}`;

    a.append(title, meta);
    li.appendChild(a);
    ul.appendChild(li);
  }
}

function clearRecentSection() {
  const ul = document.getElementById("dashboard-recent-list");
  const empty = document.getElementById("dashboard-recent-empty");
  if (ul) ul.replaceChildren();
  if (empty) empty.hidden = true;
}

async function loadRecentTickets() {
  const { items } = await listTickets({
    sortBy: "createdAt",
    order: "desc",
    page: 1,
    limit: 5,
  });
  renderRecentTickets(Array.isArray(items) ? items : []);
}

export async function initDashboard() {
  initLogout("#logout-btn");
  showUserWelcome();

  const errEl = document.getElementById("dashboard-stats-error");
  if (errEl) {
    errEl.hidden = true;
    errEl.textContent = "";
  }

  try {
    await Promise.all([loadTicketStats(), loadRecentTickets()]);
  } catch (e) {
    console.error(e);
    if (errEl) {
      errEl.textContent =
        e?.message ??
        "Could not load dashboard data. Check the API connection.";
      errEl.hidden = false;
    }
    setStatText("stat-total", "—");
    setStatText("stat-open", "—");
    setStatText("stat-in-progress", "—");
    setStatText("stat-resolved", "—");
    clearRecentSection();
  }
}
