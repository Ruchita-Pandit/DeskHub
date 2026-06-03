import {
  initLogin,
  initLogout,
} from "./modules/auth.js";

const currentPage =
  document.body.dataset.page;

switch (currentPage) {

  case "login":
    initLogin();
    break;

  case "dashboard":
    initLogout();
    break;

  default:
    console.log(
      "No page matched"
    );
}