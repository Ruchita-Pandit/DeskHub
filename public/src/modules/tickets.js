import {
    listTickets,
    listUsers,
    createTicket
}
from "../api/ticket.js";

import {
    formatDate
}
from "../utils/formatDate.js";

import {
    logout,
    isAuthenticated
}
from "../api/auth.js";

import {
    debounce
}
from "../utils/debounce.js";

import {
    openModal,
    showToast
}
from "./ui.js";

import {
    required,
    minLength,
    maxLength,
    email,
    oneOf,
    validateField,
    validateForm
}
from "./form.js";

const loadingState =
    document.getElementById("loadingState");

const errorState =
    document.getElementById("errorState");

const emptyState =
    document.getElementById("emptyState");

const tableContainer =
    document.getElementById("tableContainer");

const tableBody =
    document.getElementById("ticketsTableBody");

const retryBtn =
    document.getElementById("retryBtn");

const logoutBtn =
    document.getElementById("logoutBtn");

const newTicketBtn =
    document.getElementById("newTicketBtn");

const searchInput =
    document.getElementById("searchInput");

const statusFilter =
    document.getElementById("statusFilter");

const priorityFilter =
    document.getElementById("priorityFilter");

const sortSelect =
    document.getElementById("sortSelect");

const pagination =
    document.getElementById("pagination");

const state = {

    search:"",
    status:"",
    priority:"",
    order:"desc",
    page:1
};

let usersMap = {};

let createModalRef =
    null;

const CREATE_RULES = {
    title:[
        required,
        minLength(3),
        maxLength(200)
    ],
    description:[
        required,
        minLength(10),
        maxLength(5000)
    ],
    customerName:[
        required,
        maxLength(100)
    ],
    customerEmail:[
        required,
        email
    ],
    priority:[
        required,
        oneOf([
            "urgent",
            "high",
            "medium",
            "low"
        ])
    ],
    category:[
        required,
        oneOf([
            "auth",
            "billing",
            "bug",
            "feature"
        ])
    ]
};

function escapeHtml(text){

    if(text === null || text === undefined){

        return "";
    }

    const div =
        document.createElement("div");

    div.textContent =
        String(text);

    return div.innerHTML;
}

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

    newTicketBtn.addEventListener(
        "click",
        openCreateTicketModal
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

    tableBody.addEventListener(
        "click",
        (event)=>{

            const row =
                event.target.closest(
                    "tr[data-ticket-id]"
                );

            if(!row){

                return;
            }

            const id =
                row.getAttribute(
                    "data-ticket-id"
                );

            window.location.href =
                `./ticket-detail.html?id=${encodeURIComponent(id)}`;
        }
    );

    tableBody.addEventListener(
        "keydown",
        (event)=>{

            if(event.key !== "Enter" && event.key !== " "){

                return;
            }

            const row =
                event.target.closest(
                    "tr[data-ticket-id]"
                );

            if(!row){

                return;
            }

            event.preventDefault();

            const id =
                row.getAttribute(
                    "data-ticket-id"
                );

            window.location.href =
                `./ticket-detail.html?id=${encodeURIComponent(id)}`;
        }
    );
}

function handleLogout(){

    logout();

    window.location.href =
        "index.html";
}

function getCreateFormValues(form){

    return {
        title: form.title.value,
        description: form.description.value,
        customerName: form.customerName.value,
        customerEmail: form.customerEmail.value,
        priority: form.priority.value,
        category: form.category.value,
        assignedTo: form.assignedTo.value
    };
}

function setFieldError(form, field, message){

    const span =
        form.querySelector(
            `[data-error-for="${field}"]`
        );

    if(span){

        span.textContent =
            message || "";
    }

    const control =
        form.elements[field];

    if(control){

        control.classList.toggle(
            "input-invalid",
            Boolean(message)
        );
    }
}

function clearCreateErrors(form){

    Object.keys(CREATE_RULES).forEach((field)=>{

        setFieldError(
            form,
            field,
            ""
        );
    });
}

function updateCreateSubmitState(form, submitBtn){

    const values =
        getCreateFormValues(form);

    const { valid } =
        validateForm(
            CREATE_RULES,
            (field)=>
                values[field]
        );

    submitBtn.disabled =
        !valid;
}

function openCreateTicketModal(){

    if(createModalRef){

        return;
    }

    const form =
        document.createElement("form");

    form.id =
        "createTicketForm";

    form.className =
        "stack-form";

    form.innerHTML = `
        <div class="form-field">
            <label for="ct-title">Title</label>
            <input class="input-control" id="ct-title" name="title" type="text" autocomplete="off">
            <span class="field-error" data-error-for="title"></span>
        </div>
        <div class="form-field">
            <label for="ct-desc">Description</label>
            <textarea class="input-control textarea" id="ct-desc" name="description" rows="4"></textarea>
            <span class="field-error" data-error-for="description"></span>
        </div>
        <div class="form-field">
            <label for="ct-cname">Customer name</label>
            <input class="input-control" id="ct-cname" name="customerName" type="text" autocomplete="name">
            <span class="field-error" data-error-for="customerName"></span>
        </div>
        <div class="form-field">
            <label for="ct-cemail">Customer email</label>
            <input class="input-control" id="ct-cemail" name="customerEmail" type="email" autocomplete="email">
            <span class="field-error" data-error-for="customerEmail"></span>
        </div>
        <div class="form-field form-field--row">
            <div>
                <label for="ct-priority">Priority</label>
                <select class="input-control" id="ct-priority" name="priority">
                    <option value="">Select…</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
                <span class="field-error" data-error-for="priority"></span>
            </div>
            <div>
                <label for="ct-category">Category</label>
                <select class="input-control" id="ct-category" name="category">
                    <option value="">Select…</option>
                    <option value="auth">Auth</option>
                    <option value="billing">Billing</option>
                    <option value="bug">Bug</option>
                    <option value="feature">Feature</option>
                </select>
                <span class="field-error" data-error-for="category"></span>
            </div>
        </div>
        <div class="form-field">
            <label for="ct-assign">Assignee (optional)</label>
            <select class="input-control" id="ct-assign" name="assignedTo">
                <option value="">Unassigned</option>
            </select>
        </div>
    `;

    const assignSelect =
        form.elements.assignedTo;

    Object.entries(usersMap).forEach(([id, name])=>{

        const opt =
            document.createElement("option");

        opt.value =
            id;

        opt.textContent =
            name;

        assignSelect.append(opt);
    });

    const footer =
        document.createElement("div");

    footer.className =
        "modal-footer modal-footer--row";

    const cancel =
        document.createElement("button");

    cancel.type =
        "button";

    cancel.className =
        "btn btn--secondary";

    cancel.textContent =
        "Cancel";

    const submitBtn =
        document.createElement("button");

    submitBtn.type =
        "submit";

    submitBtn.className =
        "btn btn--primary";

    submitBtn.textContent =
        "Create";

    submitBtn.disabled =
        true;

    footer.append(
        cancel,
        submitBtn
    );

    createModalRef =
        openModal({
            title:"New ticket",
            content: form,
            footer,
            onClose(){

                createModalRef = null;
            }
        });

    cancel.addEventListener(
        "click",
        ()=>{

            createModalRef.close();

            createModalRef = null;
        }
    );

    function bindBlur(name){

        form.elements[name].addEventListener(
            "blur",
            ()=>{

                const values =
                    getCreateFormValues(form);

                const msg =
                    validateField(
                        values[name],
                        CREATE_RULES[name]
                    );

                setFieldError(
                    form,
                    name,
                    msg || ""
                );

                updateCreateSubmitState(
                    form,
                    submitBtn
                );
            }
        );
    }

    [
        "title",
        "description",
        "customerName",
        "customerEmail",
        "priority",
        "category"
    ].forEach(bindBlur);

    form.addEventListener(
        "input",
        ()=>{

            updateCreateSubmitState(
                form,
                submitBtn
            );
        }
    );

    form.addEventListener(
        "change",
        ()=>{

            updateCreateSubmitState(
                form,
                submitBtn
            );
        }
    );

    form.addEventListener(
        "submit",
        async (event)=>{

            event.preventDefault();

            clearCreateErrors(form);

            const values =
                getCreateFormValues(form);

            const { valid, errors } =
                validateForm(
                    CREATE_RULES,
                    (field)=>
                        values[field]
                );

            Object.entries(errors).forEach(([field, msg])=>{

                setFieldError(
                    form,
                    field,
                    msg
                );
            });

            if(!valid){

                showToast(
                    "Fix the highlighted fields",
                    "error"
                );

                return;
            }

            submitBtn.disabled =
                true;

            const now =
                new Date().toISOString();

            const payload = {
                title: values.title.trim(),
                description: values.description.trim(),
                customerName: values.customerName.trim(),
                customerEmail: values.customerEmail.trim(),
                priority: values.priority,
                category: values.category,
                status: "open",
                assignedTo:
                    values.assignedTo === ""
                        ? null
                        : Number(
                            values.assignedTo
                        ),
                createdAt: now,
                updatedAt: now
            };

            try{

                await createTicket(payload);

                createModalRef.close();

                createModalRef = null;

                showToast(
                    "Ticket created",
                    "success"
                );

                state.page = 1;

                await refreshTickets();
            }
            catch(error){

                console.error(error);

                showToast(
                    "Could not create ticket",
                    "error"
                );

                submitBtn.disabled =
                    false;
            }
        }
    );

    updateCreateSubmitState(
        form,
        submitBtn
    );
}

async function refreshTickets(){

    showLoading();

    try{

        const [
            ticketsResponse,
            usersResponse
        ] = await Promise.all([

            listTickets(state),

            listUsers()
        ]);

        const tickets =
            ticketsResponse.data;

        const users =
            usersResponse.data;

        const total =
            Number(
                ticketsResponse.headers.get(
                    "X-Total-Count"
                )
            );

        buildUsersMap(users);

        if(tickets.length === 0){

            showEmpty();

            return;
        }

        renderTable(tickets);

        renderPagination(total);

        showTable();
    }
    catch(error){

        console.error(error);

        showError();
    }
}

function buildUsersMap(users){

    usersMap = {};

    users.forEach((user)=>{

        usersMap[user.id] =
            user.name;
    });
}

function renderTable(tickets){

    const rows = tickets.map((ticket)=>{

        return `
            <tr class="ticket-row" data-ticket-id="${ticket.id}" role="link" tabindex="0">

                <td>${ticket.id}</td>

                <td>${escapeHtml(ticket.title)}</td>

                <td>${escapeHtml(ticket.customerName)}</td>

                <td class="priority-${ticket.priority}">
                    ${escapeHtml(ticket.priority)}
                </td>

                <td>${escapeHtml(ticket.status)}</td>

                <td>${escapeHtml(usersMap[ticket.assignedTo] || "Unassigned")}</td>

                <td>${formatDate(ticket.createdAt)}</td>

            </tr>
        `;
    }).join("");

    tableBody.innerHTML = rows;
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
                type="button"
                class="${state.page === i ? "active" : ""}"
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

    tableContainer.classList.add(
        "hidden"
    );

    pagination.classList.add(
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

    tableContainer.classList.add(
        "hidden"
    );

    pagination.classList.add(
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

    tableContainer.classList.add(
        "hidden"
    );

    pagination.classList.add(
        "hidden"
    );
}

function showTable(){

    loadingState.classList.add(
        "hidden"
    );

    errorState.classList.add(
        "hidden"
    );

    emptyState.classList.add(
        "hidden"
    );

    tableContainer.classList.remove(
        "hidden"
    );
}
