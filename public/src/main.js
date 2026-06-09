import {
    initLogin,
    initDashboard
}
from "./modules/auth.js";

import {
    initTicketsList
}
from "./modules/tickets.js";

import {
    initTicketDetail
}
from "./modules/ticketDetail.js";

const page =
    document.body.dataset.page;

switch(page){

    case "login":
        initLogin();
        break;

    case "dashboard":
        initDashboard();
        break;

    case "tickets-list":
        initTicketsList();
        break;

    case "ticket-detail":
        initTicketDetail();
        break;
}