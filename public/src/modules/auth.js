import {
    login,
    logout,
    isAuthenticated
}
from "../api/auth.js";

const loginForm =
    document.getElementById("loginForm");

const errorMessage =
    document.getElementById("errorMessage");

const logoutBtn =
    document.getElementById("logoutBtn");

export function initLogin(){

    if(isAuthenticated()){

        window.location.href =
            "dashboard.html";

        return;
    }

    loginForm.addEventListener(
        "submit",
        async (event)=>{

            event.preventDefault();

            const email =
                document.getElementById("email").value;

            const password =
                document.getElementById("password").value;

            errorMessage.textContent = "";

            try{

                await login(email, password);

                window.location.href =
                    "dashboard.html";

            }
            catch(error){

                errorMessage.textContent =
                    error.message;
            }
        }
    );
}

export function initDashboard(){

    if(!isAuthenticated()){

        window.location.href = "index.html";

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
}