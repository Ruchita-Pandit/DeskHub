import { initLogin, requireAuth } from "./modules/auth.js";
import { initTicketsList } from "./modules/tickets.js";
import { initTicketDetail } from "./modules/ticketDetail.js";
import { initDashboard } from "./modules/dashboard.js";


console.log("DeskHub booting…");

const page = document.body.dataset.page;

if (!page) {
  console.error("No data-page attribute found on <body>. Add data-page='pagename' to your HTML.");
}
console.log(` Current page: ${page}`);

const protectedPages = new Set(["dashboard", "tickets-list", "ticket-detail"]);

// Top-level `return` is invalid in ES modules; gate the switch instead.
if (!(protectedPages.has(page) && !requireAuth())) {
  switch (page) {
    case "login":
      initLogin();
      break;
    case "dashboard":
      void initDashboard();
      break;
    case "tickets-list":
      initTicketsList();
      break;
    case "ticket-detail":
      initTicketDetail();
      break;
    default:
      console.warn("Unknown page:", page);
  }
}
