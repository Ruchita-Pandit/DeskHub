import {
    listTickets
}
from "../api/tickets.js";

import {
    isAuthenticated,
    logout
}
from "../api/auth.js";

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