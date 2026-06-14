import {
    getTicket,
    updateTicket,
    deleteTicket,
    listComments,
    addComment,
  } from "../api/tickets.js";
  import { get } from "../api/client.js";
  import { getCurrentUser } from "../api/auth.js";
  import { requireAuth, initLogout } from "./auth.js";
  import { formatDateTime } from "../utils/formatDate.js";
  import { showToast, confirmDialog, showLoader, hideLoader } from "./ui.js";
  
  let usersCache = null;
  let usersLoadPromise = null;
  
  async function loadUsersOnce() {
    if (usersCache) return usersCache;
    if (!usersLoadPromise) {
      usersLoadPromise = get("/users")
        .then((res) => {
          const body = res.data;
          const users = Array.isArray(body)
            ? body
            : Array.isArray(body?.data)
              ? body.data
              : [];
          usersCache = users;
          return usersCache;
        })
        .finally(() => {
          usersLoadPromise = null;
        });
    }
    return usersLoadPromise;
  }
  
  function userNameMap(users) {
    return new Map(users.map((u) => [u.id, u.name]));
  }
  
  function parseTicketId() {
    const idStr = new URLSearchParams(window.location.search).get("id");
    if (idStr == null || idStr === "") return null;
    const n = Number(idStr);
    if (!Number.isInteger(n) || n < 1) return null;
    return n;
  }
  
  function setError(message) {
    const text = document.getElementById("error-text");
    const box = document.getElementById("error");
    if (text) text.textContent = message;
    if (box) box.hidden = false;
  }
  
  function renderTicket(ticket) {
    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val == null || val === "" ? "—" : String(val);
    };
  
    setText("ticket-id", `#${ticket.id}`);
    document.title = `DeskHub — ${ticket.title ?? "Ticket"}`;
  
    const title = document.getElementById("ticket-title");
    if (title) title.textContent = ticket.title ?? "";
  
    setText("ticket-customer", ticket.customerName);
    setText("ticket-customer-email", ticket.customerEmail);
    setText("ticket-category", ticket.category);
    setText("ticket-created", formatDateTime(ticket.createdAt));
    setText("ticket-updated", formatDateTime(ticket.updatedAt));
  
    const desc = document.getElementById("ticket-description");
    if (desc) desc.textContent = ticket.description ?? "—";
  
    const statusEl = document.getElementById("status-select");
    if (statusEl) statusEl.value = ticket.status ?? "open";
  
    const priEl = document.getElementById("priority-select");
    if (priEl) priEl.value = ticket.priority ?? "medium";
  
    const asEl = document.getElementById("assignee-select");
    if (asEl) {
      const v = ticket.assignedTo == null ? "" : String(ticket.assignedTo);
      if ([...asEl.options].some((o) => o.value === v)) asEl.value = v;
      else asEl.value = "";
    }
  }
  
  function fillAssigneeSelect(selectEl, users, assignedTo) {
    const want = assignedTo == null ? "" : String(assignedTo);
    selectEl.replaceChildren();
  
    const un = document.createElement("option");
    un.value = "";
    un.textContent = "Unassigned";
    selectEl.appendChild(un);
  
    for (const u of users) {
      const o = document.createElement("option");
      o.value = String(u.id);
      o.textContent = u.name;
      selectEl.appendChild(o);
    }
  
    if (want && [...selectEl.options].some((o) => o.value === want)) {
      selectEl.value = want;
    } else {
      selectEl.value = "";
    }
  }
  
  function renderComments(comments, nameByUserId) {
    const ul = document.getElementById("comments-list");
    if (!ul) return;
  
    ul.replaceChildren();
    const sorted = [...comments].sort((a, b) =>
      String(a.createdAt ?? "").localeCompare(String(b.createdAt ?? ""))
    );
  
    for (const c of sorted) {
      const li = document.createElement("li");
      li.className = "comment-item";
  
      const head = document.createElement("div");
      head.className = "comment-head";
      const author = nameByUserId.get(c.authorId) ?? `User #${c.authorId}`;
      head.textContent = `${author} · ${formatDateTime(c.createdAt)}`;
  
      const body = document.createElement("p");
      body.className = "comment-body";
      body.textContent = c.content ?? "";
  
      li.append(head, body);
      ul.appendChild(li);
    }
  }
  
  export async function initTicketDetail() {
    if (!requireAuth()) return;
    initLogout("#logout-btn");
  
    const ticketId = parseTicketId();
    const loading = document.getElementById("loading");
    const errBox = document.getElementById("error");
    const shell = document.getElementById("ticket-shell");
    const commentsShell = document.getElementById("comments-shell");
  
    if (ticketId == null) {
      setError("Missing or invalid ticket id. Open a ticket from the tickets list.");
      if (loading) loading.hidden = true;
      return;
    }

    const statusSelect = document.getElementById("status-select");
    const prioritySelect = document.getElementById("priority-select");
    const assigneeSelect = document.getElementById("assignee-select");
    const editBtn = document.getElementById("edit-ticket-btn");
    const saveBtn = document.getElementById("save-ticket-btn");
    const cancelBtn = document.getElementById("cancel-edit-btn");

    /** Last saved values from the server (for Cancel + change detection). */
    let controlsSnapshot = {
      status: "open",
      priority: "medium",
      assignedTo: null,
    };

    let lastTicket = null;

    function syncSnapshotFromTicket(ticket) {
      controlsSnapshot = {
        status: ticket.status ?? "open",
        priority: ticket.priority ?? "medium",
        assignedTo:
          ticket.assignedTo == null || ticket.assignedTo === ""
            ? null
            : Number(ticket.assignedTo),
      };
      if (
        controlsSnapshot.assignedTo != null &&
        !Number.isFinite(controlsSnapshot.assignedTo)
      ) {
        controlsSnapshot.assignedTo = null;
      }
    }

    function applySnapshotToSelects() {
      if (!statusSelect || !prioritySelect || !assigneeSelect) return;
      statusSelect.value = controlsSnapshot.status;
      prioritySelect.value = controlsSnapshot.priority;
      const a = controlsSnapshot.assignedTo;
      assigneeSelect.value = a == null ? "" : String(a);
    }

    function setControlsEditing(editing) {
      if (!statusSelect || !prioritySelect || !assigneeSelect) return;
      statusSelect.disabled = !editing;
      prioritySelect.disabled = !editing;
      assigneeSelect.disabled = !editing;
      if (editBtn) editBtn.hidden = editing;
      if (saveBtn) saveBtn.hidden = !editing;
      if (cancelBtn) cancelBtn.hidden = !editing;
    }

    async function loadAll() {
      
      if (loading) loading.hidden = false;
      if (errBox) errBox.hidden = true;
      if (shell) shell.hidden = true;
      if (commentsShell) commentsShell.hidden = true;

      try {
        const [users, ticket, commentsRaw] = await Promise.all([
            loadUsersOnce(),
            getTicket(ticketId),
            listComments(ticketId),
          ]);
        const nameByUserId = userNameMap(users);
        const comments = Array.isArray(commentsRaw) ? commentsRaw : [];

        const assigneeEl = document.getElementById("assignee-select");
        if (assigneeEl) fillAssigneeSelect(assigneeEl, users, ticket.assignedTo);

        renderTicket(ticket);
        lastTicket = ticket && typeof ticket === "object" ? { ...ticket } : null;
        renderComments(comments, nameByUserId);

        syncSnapshotFromTicket(ticket);
        applySnapshotToSelects();
        setControlsEditing(false);

        if (shell) shell.hidden = false;
        if (commentsShell) commentsShell.hidden = false;
      } catch (err) {
        console.error(err);
        setError(err?.message || "Could not load this ticket.");
      } finally {
        if (loading) loading.hidden = true;
      }
    }

    await loadAll();

    editBtn?.addEventListener("click", () => {
      applySnapshotToSelects();
      setControlsEditing(true);
      statusSelect?.focus();
    });

    cancelBtn?.addEventListener("click", () => {
      applySnapshotToSelects();
      setControlsEditing(false);
    });

    saveBtn?.addEventListener("click", async () => {
      if (!statusSelect || !prioritySelect || !assigneeSelect) return;

      const rawAssign = assigneeSelect.value;
      const assignedNum = rawAssign === "" ? null : Number(rawAssign);
      const assignedTo =
        assignedNum != null && Number.isFinite(assignedNum) ? assignedNum : null;

      const next = {
        status: statusSelect.value,
        priority: prioritySelect.value,
        assignedTo,
      };

      const unchanged =
        next.status === controlsSnapshot.status &&
        next.priority === controlsSnapshot.priority &&
        next.assignedTo === controlsSnapshot.assignedTo;

      if (unchanged) {
        showToast("No changes to save.", "info");
        setControlsEditing(false);
        return;
      }

      const rollbackSnapshot = { ...controlsSnapshot };
      const rollbackTicket =
        lastTicket && typeof lastTicket === "object" ? { ...lastTicket } : null;

      const optimisticUpdatedAt = new Date().toISOString();

      // Optimistic UI: treat save as succeeded immediately
      controlsSnapshot = {
        status: next.status,
        priority: next.priority,
        assignedTo: next.assignedTo,
      };
      applySnapshotToSelects();

      if (lastTicket) {
        lastTicket = {
          ...lastTicket,
          status: next.status,
          priority: next.priority,
          assignedTo: next.assignedTo,
          updatedAt: optimisticUpdatedAt,
        };
        renderTicket(lastTicket);
      }

      setControlsEditing(false);

      if (saveBtn) saveBtn.disabled = true;
      if (cancelBtn) cancelBtn.disabled = true;
      if (editBtn) editBtn.disabled = true;

      try {
        const updated = await updateTicket(ticketId, {
          status: next.status,
          priority: next.priority,
          assignedTo: next.assignedTo,
        });

        if (updated && typeof updated === "object" && updated.id != null) {
          lastTicket = { ...updated };
          syncSnapshotFromTicket(lastTicket);
          applySnapshotToSelects();
          renderTicket(lastTicket);
        } else {
          try {
            const fresh = await getTicket(ticketId);
            lastTicket =
              fresh && typeof fresh === "object" ? { ...fresh } : lastTicket;
            if (lastTicket) {
              syncSnapshotFromTicket(lastTicket);
              applySnapshotToSelects();
              renderTicket(lastTicket);
            }
          } catch (reconcileErr) {
            console.error(reconcileErr);
            showToast(
              "Saved, but could not refresh from server.",
              "warning"
            );
          }
        }

        showToast("Ticket updated", "success");
      } catch (err) {
        console.error(err);
        controlsSnapshot = rollbackSnapshot;
        applySnapshotToSelects();
        if (rollbackTicket) {
          lastTicket = rollbackTicket;
          renderTicket(lastTicket);
        } else {
          await loadAll();
        }
        window.alert(err?.message || "Update failed.");
      } finally {
        if (saveBtn) saveBtn.disabled = false;
        if (cancelBtn) cancelBtn.disabled = false;
        if (editBtn) editBtn.disabled = false;
      }
    });

    document.getElementById("add-comment-btn")?.addEventListener("click", async () => {
      const ta = document.getElementById("new-comment");
      const content = (ta?.value ?? "").trim();
      if (!content) return;
  
      const me = getCurrentUser();
      if (!me?.id) {
        window.alert("You must be signed in to comment.");
        return;
      }
  
      showLoader("Posting comment")
      try {
        await Promise.all([
          addComment({
            ticketId,
            authorId: me.id,
            content,
          }),
          new Promise((r) => setTimeout(r,2000)),
        ]);
        if (ta) ta.value = "";
        showToast("Comment posted", "success");
        await loadAll();
      } catch (err) {
        console.error(err);
        window.alert(err?.message || "Could not post comment.");
      }finally{
        hideLoader();
      }
    });
  
    document.getElementById("delete-btn")?.addEventListener("click", async () => {
      const ok = await confirmDialog(
        "Delete this ticket permanently? This cannot be undone.",
        {
          title: "Delete ticket",
          okText: "Delete",
          cancelText: "Cancel",
        }
      );
      if (!ok) return;
      showLoader("Deleting ticket…");
      try {
        await deleteTicket(ticketId);
        showToast("Ticket deleted", "success");
        window.location.href = "tickets.html";
      } catch (err) {
        console.error(err);
        showToast(err?.message || "Delete failed.", "error");
      } finally {
        hideLoader();
      }
    });
  }