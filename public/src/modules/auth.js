import {
  login,
  logout,
} from "../api/auth.js";

export function initLogin() {

  const form =
    document.getElementById(
      "loginForm"
    );

  const errorMessage =
    document.getElementById(
      "errorMessage"
    );

  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      errorMessage.textContent = "";

      const formData =
        new FormData(form);

      const email =
        formData.get("email");

      const password =
        formData.get("password");

      try {

        await login(
          email,
          password
        );

        window.location.href =
          "/dashboard.html";

      } catch (error) {

        errorMessage.textContent =
          error.message;
      }
    }
  );
}

export function initLogout() {

  const logoutBtn =
    document.getElementById(
      "logoutBtn"
    );

  logoutBtn.addEventListener(
    "click",
    () => {

      logout();

      window.location.href =
        "/index.html";
    }
  );
}