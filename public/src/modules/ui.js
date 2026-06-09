const TOAST_DURATION_MS =
    3000;

let toastContainer =
    null;

function ensureToastContainer(){

    if(toastContainer && document.body.contains(toastContainer)){

        return toastContainer;
    }

    toastContainer =
        document.createElement("div");

    toastContainer.className =
        "toast-container";

    toastContainer.setAttribute(
        "aria-live",
        "polite"
    );

    document.body.appendChild(toastContainer);

    return toastContainer;
}

export function showToast(message, variant = "info"){

    const container =
        ensureToastContainer();

    const el =
        document.createElement("div");

    el.className =
        `toast toast--${variant}`;

    el.textContent =
        message;

    container.appendChild(el);

    window.setTimeout(()=>{

        el.classList.add(
            "toast--out"
        );

        window.setTimeout(()=>{

            el.remove();

            if(container.childElementCount === 0){

                container.remove();

                toastContainer = null;
            }
        }, 200);
    }, TOAST_DURATION_MS);
}

export function openModal(options){

    const {
        title,
        content,
        footer
    } = options;

    const overlay =
        document.createElement("div");

    overlay.className =
        "modal-overlay";

    overlay.setAttribute(
        "role",
        "dialog"
    );

    overlay.setAttribute(
        "aria-modal",
        "true"
    );

    const dialog =
        document.createElement("div");

    dialog.className =
        "modal-dialog";

    const header =
        document.createElement("div");

    header.className =
        "modal-header";

    const h =
        document.createElement("h2");

    h.className =
        "modal-title";

    h.textContent =
        title;

    const closeBtn =
        document.createElement("button");

    closeBtn.type =
        "button";

    closeBtn.className =
        "modal-close";

    closeBtn.setAttribute(
        "aria-label",
        "Close"
    );

    closeBtn.textContent =
        "×";

    header.append(h, closeBtn);

    const body =
        document.createElement("div");

    body.className =
        "modal-body";

    if(typeof content === "string"){

        body.innerHTML =
            content;
    }
    else if(content){

        body.append(content);
    }

    dialog.append(header, body);

    if(footer){

        const foot =
            document.createElement("div");

        foot.className =
            "modal-footer";

        foot.append(footer);

        dialog.append(foot);
    }

    overlay.append(dialog);

    document.body.appendChild(overlay);

    let closed =
        false;

    function close(){

        if(closed){

            return;
        }

        closed = true;

        document.removeEventListener(
            "keydown",
            onKey
        );

        overlay.remove();

        if(typeof options.onClose === "function"){

            options.onClose();
        }
    }

    function onKey(event){

        if(event.key === "Escape"){

            event.preventDefault();

            close();
        }
    }

    overlay.addEventListener(
        "click",
        (event)=>{

            if(event.target === overlay){

                close();
            }
        }
    );

    closeBtn.addEventListener(
        "click",
        close
    );

    document.addEventListener(
        "keydown",
        onKey
    );

    return {
        close,
        root: overlay,
        body
    };
}

export function confirmDialog(options){

    const {
        title = "Confirm",
        message = "Are you sure?",
        confirmText = "Yes",
        cancelText = "No"
    } = options;

    return new Promise((resolve)=>{

        const state = {
            resolved: false
        };

        let modalRef;

        function finish(value){

            if(state.resolved){

                return;
            }

            state.resolved = true;

            modalRef.close();

            resolve(value);
        }

        const footer =
            document.createElement("div");

        footer.className =
            "modal-footer modal-footer--row";

        const cancel =
            document.createElement("button");

        cancel.type =
            "button";

        cancel.className =
            "btn btn--secondary";

        cancel.textContent =
            cancelText;

        const confirm =
            document.createElement("button");

        confirm.type =
            "button";

        confirm.className =
            "btn btn--danger";

        confirm.textContent =
            confirmText;

        footer.append(cancel, confirm);

        const msg =
            document.createElement("p");

        msg.className =
            "modal-message";

        msg.textContent =
            message;

        modalRef =
            openModal({
                title,
                content: msg,
                footer,
                onClose(){

                    if(state.resolved){

                        return;
                    }

                    state.resolved = true;

                    resolve(false);
                }
            });

        cancel.addEventListener(
            "click",
            ()=>finish(false)
        );

        confirm.addEventListener(
            "click",
            ()=>finish(true)
        );
    });
}
