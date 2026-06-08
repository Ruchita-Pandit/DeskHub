import {
    listTickets,
    listUsers
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

function handleLogout(){

    logout();

    window.location.href =
        "index.html";
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
            <tr>

                <td>${ticket.id}</td>

                <td>${ticket.title}</td>

                <td>
                    ${ticket.customerName}
                </td>

                <td class="
                    priority-${ticket.priority}
                ">
                    ${ticket.priority}
                </td>

                <td>${ticket.status}</td>

                <td>
                    ${
                        usersMap[ticket.assignedTo]
                        || "Unassigned"
                    }
                </td>

                <td>
                    ${formatDate(ticket.createdAt)}
                </td>

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