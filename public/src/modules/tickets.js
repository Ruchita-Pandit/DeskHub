import {
    listTickets,
    listUsers
}
from "../api/tickets.js";

import {
    formatDate
}
from "../utils/formatDate.js";

import {
    logout,
    isAuthenticated
}
from "../api/auth.js";

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

let usersMap = {};

export async function initTicketsList(){

    if(!isAuthenticated()){

        window.location.href =
            "index.html";

        return;
    }

    logoutBtn.addEventListener(
        "click",
        handleLogout
    );

    retryBtn.addEventListener(
        "click",
        refreshTickets
    );

    await refreshTickets();
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
            tickets,
            users
        ] = await Promise.all([
            listTickets(),
            listUsers()
        ]);

        buildUsersMap(users);

        if(tickets.length === 0){

            showEmpty();

            return;
        }

        renderTable(tickets);

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

                <td>
                    ${ticket.title}
                </td>

                <td>
                    ${ticket.customerName}
                </td>

                <td class="
                    priority-${ticket.priority}
                ">
                    ${ticket.priority}
                </td>

                <td>
                    ${ticket.status}
                </td>

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