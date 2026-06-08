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