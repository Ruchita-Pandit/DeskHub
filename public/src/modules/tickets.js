import {
    listTickets,
    createTicket,
} from "../api/tickets.js";

import {
    isAuthenticated,
    logout,
    getCurrentUser,
} from "../api/auth.js";

import { openModal, closeModal, showToast } from "./ui.js";
import {
    validateForm,
    required,
    minLength,
    email,
    oneOf,
} from "./form.js";

import {
    formatDate
}
from "../utils/formatDate.js";

import {
    debounce
}
from "../utils/debounce.js";

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );

const loadingState =
    document.getElementById(
        "loadingState"
    );

const errorState =
    document.getElementById(
        "errorState"
    );

const emptyState =
    document.getElementById(
        "emptyState"
    );

const ticketsContainer =
    document.getElementById(
        "ticketsContainer"
    );

const ticketTableBody =
    document.getElementById(
        "ticketTableBody"
    );

const retryBtn =
    document.getElementById(
        "retryBtn"
    );

const searchInput =
    document.getElementById(
        "searchInput"
    );

const statusFilter =
    document.getElementById(
        "statusFilter"
    );

const priorityFilter =
    document.getElementById(
        "priorityFilter"
    );

const sortSelect =
    document.getElementById(
        "sortSelect"
    );

const pagination =
    document.getElementById(
        "pagination"
    );

const newTicketBtn = document.getElementById("newTicketBtn");

const newTicketFieldRules = {
    title: [required("Title is required"), minLength(3, "Title must be at least 3 characters")],
    description: [
        required("Description is required"),
        minLength(10, "Description must be at least 10 characters"),
    ],
    customerName: [required("Customer name is required")],
    customerEmail: [required("Customer email is required"), email()],
    category: [
        required("Select a category"),
        oneOf(
            ["auth", "billing", "bug", "feature", "general"],
            "Choose a valid category"
        ),
    ],
    priority: [
        oneOf(
            ["low", "medium", "high", "urgent"],
            "Choose a valid priority"
        ),
    ],
};

const state = {

    search:"",
    status:"",
    priority:"",
    order:"desc",
    page:1,
    limit:10
};

export async function initTicketsList(){

    if(!isAuthenticated()){

        window.location.href =
            "index.html";

        return;
    }

    bindEvents();

    await refreshTickets();
}

function bindEvents(){

    logoutBtn.addEventListener(
        "click",
        handleLogout
    );

    retryBtn.addEventListener(
        "click",
        refreshTickets
    );

    searchInput.addEventListener(
        "input",

        debounce((event)=>{

            state.search =
                event.target.value;

            state.page = 1;

            refreshTickets();

        },300)
    );

    statusFilter.addEventListener(
        "change",
        (event)=>{

            state.status =
                event.target.value;

            state.page = 1;

            refreshTickets();
        }
    );

    priorityFilter.addEventListener(
        "change",
        (event)=>{

            state.priority =
                event.target.value;

            state.page = 1;

            refreshTickets();
        }
    );

    sortSelect.addEventListener(
        "change",
        (event)=>{

            state.order =
                event.target.value;

            refreshTickets();
        }
    );

    if (newTicketBtn) {
        newTicketBtn.addEventListener("click", openNewTicketModal);
    }
}

function buildNewTicketForm() {
    const form = document.createElement("form");
    form.className = "dh-new-ticket-form";
    form.setAttribute("novalidate", "");
    form.innerHTML = `
      <div class="dh-field">
        <label class="dh-field-label" for="nt-title">Title</label>
        <input class="search-input" type="text" id="nt-title" name="title" required maxlength="200" placeholder="Short summary of the issue" autocomplete="off">
      </div>
      <div class="dh-field">
        <label class="dh-field-label" for="nt-description">Description</label>
        <textarea class="search-input" id="nt-description" name="description" required maxlength="8000" placeholder="What happened? What did you expect?" rows="4"></textarea>
      </div>
      <div class="dh-field">
        <label class="dh-field-label" for="nt-customerName">Customer name</label>
        <input class="search-input" type="text" id="nt-customerName" name="customerName" required maxlength="120" placeholder="Contact name" autocomplete="name">
      </div>
      <div class="dh-field">
        <label class="dh-field-label" for="nt-customerEmail">Customer email</label>
        <input class="search-input" type="email" id="nt-customerEmail" name="customerEmail" required maxlength="200" placeholder="name@example.com" autocomplete="email">
      </div>
      <div class="dh-field">
        <label class="dh-field-label" for="nt-category">Category</label>
        <select class="filter-select" id="nt-category" name="category" required>
          <option value="">Select category</option>
          <option value="auth">Authentication</option>
          <option value="billing">Billing</option>
          <option value="bug">Bug</option>
          <option value="feature">Feature</option>
          <option value="general">General</option>
        </select>
      </div>
      <div class="dh-field">
        <label class="dh-field-label" for="nt-priority">Priority</label>
        <select class="filter-select" id="nt-priority" name="priority" required>
          <option value="low">Low</option>
          <option value="medium" selected>Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>
      <div class="dh-modal-actions">
        <button type="button" class="btn-secondary" data-action="cancel">Cancel</button>
        <button type="submit" class="btn-primary">Create ticket</button>
      </div>
    `;

    const cancelBtn = form.querySelector('[data-action="cancel"]');
    cancelBtn.addEventListener("click", () => closeModal(undefined));

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const { isValid } = validateForm(form, newTicketFieldRules);
        if (!isValid) return;

        const fd = new FormData(form);
        const me = getCurrentUser();
        const payload = {
            title: String(fd.get("title") ?? "").trim(),
            description: String(fd.get("description") ?? "").trim(),
            customerName: String(fd.get("customerName") ?? "").trim(),
            customerEmail: String(fd.get("customerEmail") ?? "").trim(),
            category: String(fd.get("category") ?? "").trim(),
            priority: String(fd.get("priority") ?? "medium").trim(),
            status: "open",
            assignedTo:
                me && me.id != null && Number.isFinite(Number(me.id))
                    ? Number(me.id)
                    : null,
        };

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;
        try {
            const created = await createTicket(payload);
            const id = created && typeof created === "object" ? created.id : null;
            showToast("Ticket created.", "success");
            closeModal(true);
            if (id != null) {
                window.location.href = `ticket-detail.html?id=${encodeURIComponent(String(id))}`;
                return;
            }
            state.page = 1;
            state.order = "desc";
            if (sortSelect) sortSelect.value = "desc";
            await refreshTickets();
        } catch (err) {
            console.error(err);
            showToast(err?.message || "Could not create ticket.", "error");
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });

    return form;
}

function openNewTicketModal() {
    const form = buildNewTicketForm();
    void openModal(form, { title: "New ticket" });
}

async function refreshTickets(){

    try{

        showLoading();

        const response =
            await listTickets(state);

        const body = response.data;
        const tickets = Array.isArray(body)
            ? body
            : Array.isArray(body?.data)
                ? body.data
                : [];

        const hdr = response.headers.get("X-Total-Count");
        const fromHdr =
            hdr != null && hdr !== "" && !Number.isNaN(Number(hdr))
                ? Number(hdr)
                : NaN;
        const total = !Number.isNaN(fromHdr)
            ? fromHdr
            : typeof body?.items === "number"
                ? body.items
                : tickets.length;

        if(!tickets.length){

            showEmpty();

            return;
        }

        renderTable(tickets);

        renderPagination(total);

        showContent();

    }
    catch(error){

        console.error(error);

        showError();
    }
}

function renderTable(tickets){

    ticketTableBody.innerHTML =
        tickets.map((ticket)=>{

            return `
                <tr
                    class="ticket-row"
                    data-id="${ticket.id}"
                >

                    <td>
                        ${ticket.id}
                    </td>

                    <td>
                        ${ticket.title}
                    </td>

                    <td>
                        ${ticket.customerName}
                    </td>

                    <td>
                        ${ticket.priority}
                    </td>

                    <td>
                        ${ticket.status}
                    </td>

                    <td>
                        ${formatDate(
                            ticket.createdAt
                        )}
                    </td>

                </tr>
            `;
        }).join("");

    const rows =
        document.querySelectorAll(
            ".ticket-row"
        );

    rows.forEach((row)=>{

        row.addEventListener(
            "click",
            ()=>{

                window.location.href =
                    `ticket-detail.html?id=${row.dataset.id}`;
            }
        );
    });
}

function renderPagination(total){

    const totalPages =
        Math.ceil(total / 10);

    if(totalPages <= 1){

        pagination.classList.add(
            "hidden"
        );

        return;
    }

    pagination.classList.remove(
        "hidden"
    );

    let buttons = "";

    for(
        let i = 1;
        i <= totalPages;
        i++
    ){

        buttons += `
            <button
                class="
                    ${
                        state.page === i
                        ? "active"
                        : ""
                    }
                "

                data-page="${i}"
            >
                ${i}
            </button>
        `;
    }

    pagination.innerHTML =
        buttons;

    const pageButtons =
        pagination.querySelectorAll(
            "button"
        );

    pageButtons.forEach((button)=>{

        button.addEventListener(
            "click",
            ()=>{

                state.page =
                    Number(
                        button.dataset.page
                    );

                refreshTickets();
            }
        );
    });
}

function handleLogout(){

    logout();

    window.location.href =
        "index.html";
}

function showLoading(){

    loadingState.classList.remove(
        "hidden"
    );

    errorState.classList.add(
        "hidden"
    );

    emptyState.classList.add(
        "hidden"
    );

    ticketsContainer.classList.add(
        "hidden"
    );
}

function showError(){

    loadingState.classList.add(
        "hidden"
    );

    errorState.classList.remove(
        "hidden"
    );

    emptyState.classList.add(
        "hidden"
    );

    ticketsContainer.classList.add(
        "hidden"
    );
}

function showEmpty(){

    loadingState.classList.add(
        "hidden"
    );

    errorState.classList.add(
        "hidden"
    );

    emptyState.classList.remove(
        "hidden"
    );

    ticketsContainer.classList.add(
        "hidden"
    );
}

function showContent(){

    loadingState.classList.add(
        "hidden"
    );

    errorState.classList.add(
        "hidden"
    );

    emptyState.classList.add(
        "hidden"
    );

    ticketsContainer.classList.remove(
        "hidden"
    );
}