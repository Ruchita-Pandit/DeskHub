import {
    initLogin,
    initDashboard
}
from "./modules/auth.js";

const page =
    document.body.dataset.page;

switch(page){

    case "login":

        initLogin();

        break;

    case "dashboard":

        initDashboard();

        break;
}

//-----
import {
    initLogin,
    initDashboard
}
from "./modules/auth.js";

import {
    initTicketsList
}
from "./modules/tickets.js";

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
}