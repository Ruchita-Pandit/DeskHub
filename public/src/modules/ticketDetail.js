import {
    getTicket,
    updateTicket,
    deleteTicket,
    listComments,
    addComment,
    listUsers
}
from "../api/ticket.js";

import {
    formatDateTime
}
from "../utils/formatDate.js";

import {
    logout,
    isAuthenticated,
    getCurrentUser
}
from "../api/auth.js";

import {
    showToast,
    confirmDialog
}
from "./ui.js";

const loadingEl =
    document.getElementById("detailLoading");

const errorEl =
    document.getElementById("detailError");

const contentEl =
    document.getElementById("detailContent");

const retryBtn =
    document.getElementById("detailRetry");

const logoutBtn =
    document.getElementById("logoutBtn");

    document.getElementById("deleteTicketBtn");

const statusSelect =
    document.getElementById("detailStatus");

const prioritySelect =
    document.getElementById("detailPriority");

const assigneeSelect =
    document.getElementById("detailAssignee");

const commentsList =
    document.getElementById("commentsList");

const commentForm =
    document.getElementById("commentForm");

const commentInput =
    document.getElementById("commentContent");

const commentSubmit =
    document.getElementById("commentSubmit");

let ticketId =
    null;

let currentTicket =
    null;

let usersById =
    {};

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

function parseTicketId(){

    const params =
        new URLSearchParams(
            window.location.search
        );

    const raw =
        params.get("id");

    const id =
        raw === null
            ? NaN
            : Number(raw);

    if(!Number.isFinite(id) || id < 1){

        return null;
    }

    return id;
}

export async function initTicketDetail(){

    if(!isAuthenticated()){

        window.location.href =
            "index.html";

        return;
    }

    ticketId =
        parseTicketId();

    if(ticketId === null){

        window.location.href =
            "ticket.html";

        return;
    }

    logoutBtn.addEventListener(
        "click",
        ()=>{

            logout();

            window.location.href =
                "index.html";
        }
    );

    retryBtn.addEventListener(
        "click",
        loadAll
    );

    deleteBtn.addEventListener(
        "click",
        onDeleteTicket
    );

    statusSelect.addEventListener(
        "change",
        ()=>patchField(
            "status",
            statusSelect.value
        )
    );

    prioritySelect.addEventListener(
        "change",
        ()=>patchField(
            "priority",
            prioritySelect.value
        )
    );

    assigneeSelect.addEventListener(
        "change",
        ()=>{

            const raw =
                assigneeSelect.value;

            const assignedTo =
                raw === ""
                    ? null
                    : Number(raw);

            patchField(
                "assignedTo",
                assignedTo
            );
        }
    );

    commentForm.addEventListener(
        "submit",
        onAddComment
    );

    await loadAll();
}

async function loadAll(){

    showLoading();

    try{

        const [
            ticketRes,
            commentsRes,
            usersRes
        ] = await Promise.all([

            getTicket(ticketId),

            listComments(ticketId),

            listUsers()
        ]);

        const ticket =
            ticketRes.data;

        const comments =
            Array.isArray(commentsRes.data)
                ? commentsRes.data
                : [];

        const users =
            Array.isArray(usersRes.data)
                ? usersRes.data
                : [];

        usersById = {};

        users.forEach((u)=>{

            usersById[u.id] = u;
        });

        currentTicket =
            ticket;

        comments.sort((a, b)=>{

            const ta =
                new Date(a.createdAt).getTime();

            const tb =
                new Date(b.createdAt).getTime();

            return ta - tb;
        });

        renderTicket(ticket);

        renderComments(comments);

        fillAssigneeOptions(users, ticket.assignedTo);

        showContent();
    }
    catch(error){

        console.error(error);

        showError();
    }
}

function showLoading(){

    loadingEl.classList.remove(
        "hidden"
    );

    errorEl.classList.add(
        "hidden"
    );

    contentEl.classList.add(
        "hidden"
    );
}

function showError(){

    loadingEl.classList.add(
        "hidden"
    );

    errorEl.classList.remove(
        "hidden"
    );

    contentEl.classList.add(
        "hidden"
    );
}

function showContent(){

    loadingEl.classList.add(
        "hidden"
    );

    errorEl.classList.add(
        "hidden"
    );

    contentEl.classList.remove(
        "hidden"
    );
}

function renderTicket(ticket){

    document.getElementById("detailTitle").textContent =
        ticket.title;

    document.getElementById("detailDescription").innerHTML =
        escapeHtml(
            ticket.description
        ).replace(
            /\n/g,
            "<br>"
        );

    document.getElementById("detailCustomerName").textContent =
        ticket.customerName;

    document.getElementById("detailCustomerEmail").textContent =
        ticket.customerEmail;

    document.getElementById("detailCategory").textContent =
        ticket.category;

    document.getElementById("detailCreated").textContent =
        formatDateTime(
            ticket.createdAt
        );

    document.getElementById("detailUpdated").textContent =
        formatDateTime(
            ticket.updatedAt
        );

    statusSelect.value =
        ticket.status;

    prioritySelect.value =
        ticket.priority;

    assigneeSelect.value =
        ticket.assignedTo === null || ticket.assignedTo === undefined
            ? ""
            : String(ticket.assignedTo);
}

function fillAssigneeOptions(users, currentAssigned){

    assigneeSelect.innerHTML =
        `<option value="">Unassigned</option>`;

    users.forEach((u)=>{

        const opt =
            document.createElement("option");

        opt.value =
            String(u.id);

        opt.textContent =
            u.name;

        assigneeSelect.append(opt);
    });

    assigneeSelect.value =
        currentAssigned === null || currentAssigned === undefined
            ? ""
            : String(currentAssigned);
}

function renderComments(comments){

    if(comments.length === 0){

        commentsList.innerHTML =
            `<p class="muted">No comments yet.</p>`;

        return;
    }

    commentsList.innerHTML =
        comments.map((c)=>{

            const author =
                usersById[c.authorId]?.name
                || "Unknown";

            const when =
                formatDateTime(
                    c.createdAt
                );

            return `
                <article class="comment-card">
                    <header class="comment-meta">
                        <strong>${escapeHtml(author)}</strong>
                        <span class="muted">${escapeHtml(when)}</span>
                    </header>
                    <p class="comment-body">${escapeHtml(c.content).replace(/\n/g, "<br>")}</p>
                </article>
            `;
        }).join("");
}

async function patchField(field, value){

    const prev =
        currentTicket[field];

    if(prev === value){

        return;
    }

    if(field === "assignedTo" && prev === null && value === null){

        return;
    }

    try{

        const body = {
            [field]: value,
            updatedAt: new Date().toISOString()
        };

        const { data } =
            await updateTicket(
                ticketId,
                body
            );

        currentTicket =
            data;

        showToast(
            "Saved",
            "success"
        );

        await loadAll();
    }
    catch(error){

        console.error(error);

        showToast(
            "Update failed",
            "error"
        );

        await loadAll();
    }
}

async function onDeleteTicket(){

    const ok =
        await confirmDialog({
            title: "Delete ticket",
            message: "Are you sure you want to delete this ticket? This cannot be undone.",
            confirmText: "Delete",
            cancelText: "Cancel"
        });

    if(!ok){

        return;
    }

    try{

        await deleteTicket(ticketId);

        showToast(
            "Ticket deleted",
            "success"
        );

        window.location.href =
            "ticket.html";
    }
    catch(error){

        console.error(error);

        showToast(
            "Delete failed",
            "error"
        );
    }
}

async function onAddComment(event){

    event.preventDefault();

    const user =
        getCurrentUser();

    const content =
        commentInput.value.trim();

    if(content.length < 1){

        showToast(
            "Write a comment first",
            "error"
        );

        return;
    }

    commentSubmit.disabled =
        true;

    try{

        await addComment({
            ticketId,
            authorId: user.id,
            content,
            createdAt: new Date().toISOString()
        });

        commentInput.value =
            "";

        showToast(
            "Comment added",
            "success"
        );

        await loadAll();
    }
    catch(error){

        console.error(error);

        showToast(
            "Could not add comment",
            "error"
        );
    }
    finally{

        commentSubmit.disabled =
            false;
    }
}
