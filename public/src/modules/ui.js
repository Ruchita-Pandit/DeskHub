

const TOAST_DURATION_MS = 3000;
const TOAST_EXIT_MS = 280;
const MAX_VISIBLE_TOASTS = 6;

const TOAST_TYPES = new Set(["info", "success", "error", "warning"]);

let toastHost = null;

let modalBackdrop = null;
let modalResolver = null;
let modalKeyHandler = null;
let modalIsClosing = false;
let previousActiveElement = null;

let loaderEl = null;
let loaderDepth = 0;

function ensureToastHost() {
  if (toastHost && document.body.contains(toastHost)) return toastHost;
  toastHost = document.createElement("div");
  toastHost.id = "dh-toast-host";
  toastHost.className = "dh-toast-host";
  toastHost.setAttribute("aria-live", "polite");
  document.body.appendChild(toastHost);
  return toastHost;
}

function removeToastHostIfEmpty(host) {
  if (host?.childElementCount === 0) {
    host.remove();
    toastHost = null;
  }
}

function dismissToastElement(el, { immediate = false } = {}) {
  if (!el?.isConnected) return;
  const host = el.parentElement;

  const cleanup = () => {
    el.remove();
    if (host) removeToastHostIfEmpty(host);
  };

  if (immediate) {
    cleanup();
    return;
  }

  el.classList.remove("dh-toast--visible");
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    cleanup();
  };
  el.addEventListener("transitionend", finish, { once: true });
  window.setTimeout(finish, TOAST_EXIT_MS);
}

function trimOldestToasts(host, maxBeforeAdd) {
  while (host.childElementCount >= maxBeforeAdd) {
    const oldest = host.firstElementChild;
    if (!oldest) break;
    dismissToastElement(oldest, { immediate: true });
  }
}


export function showToast(message, type = "info", opts = {}) {
  const variant = TOAST_TYPES.has(type) ? type : "info";
  const duration =
    typeof opts.duration === "number" && opts.duration >= 0
      ? opts.duration
      : TOAST_DURATION_MS;

  const host = ensureToastHost();
  trimOldestToasts(host, MAX_VISIBLE_TOASTS);

  const el = document.createElement("div");
  el.className = `dh-toast dh-toast--${variant}`;
  el.setAttribute("role", "status");
  el.textContent = String(message ?? "");

  host.appendChild(el);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add("dh-toast--visible"));
  });

  window.setTimeout(() => dismissToastElement(el), duration);
}

function teardownModal(result) {
  if (modalKeyHandler) {
    document.removeEventListener("keydown", modalKeyHandler);
    modalKeyHandler = null;
  }
  if (modalBackdrop) {
    modalBackdrop.remove();
    modalBackdrop = null;
  }
  modalIsClosing = false;
  const resolve = modalResolver;
  modalResolver = null;
  if (typeof resolve === "function") {
    resolve(result);
  }
  if (
    previousActiveElement &&
    typeof previousActiveElement.focus === "function"
  ) {
    previousActiveElement.focus();
  }
  previousActiveElement = null;
}


export function closeModal(result) {
  if (!modalBackdrop || modalIsClosing) return;

  const backdrop = modalBackdrop;
  const panel = backdrop.querySelector(".dh-modal-panel");
  modalIsClosing = true;

  backdrop.classList.remove("dh-modal-backdrop--open");
  if (panel) panel.classList.remove("dh-modal-panel--open");

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    teardownModal(result);
  };

  const target = panel ?? backdrop;
  target.addEventListener("transitionend", finish, { once: true });
  window.setTimeout(finish, 320);
}

function forceCloseModalNoAnimation() {
  if (modalKeyHandler) {
    document.removeEventListener("keydown", modalKeyHandler);
    modalKeyHandler = null;
  }
  modalIsClosing = false;
  if (modalBackdrop) {
    modalBackdrop.remove();
    modalBackdrop = null;
  }
  const resolve = modalResolver;
  modalResolver = null;
  if (typeof resolve === "function") {
    resolve(undefined);
  }
  previousActiveElement = null;
}


export function openModal(content, options = {}) {
  if (modalBackdrop) {
    forceCloseModalNoAnimation();
  }

  const { title } = options;

  return new Promise((resolve) => {
    modalResolver = resolve;
    previousActiveElement = document.activeElement;

    const backdrop = document.createElement("div");
    backdrop.className = "dh-modal-backdrop";
    backdrop.setAttribute("role", "presentation");

    const panel = document.createElement("div");
    panel.className = "dh-modal-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    if (title) panel.setAttribute("aria-labelledby", "dh-modal-title");

    const header = document.createElement("div");
    header.className = "dh-modal-header";

    const titleEl = document.createElement("div");
    titleEl.id = "dh-modal-title";
    titleEl.className = "dh-modal-title";
    titleEl.textContent = title || "";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "dh-modal-close";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.innerHTML = "&times;";

    header.append(titleEl, closeBtn);

    const body = document.createElement("div");
    body.className = "dh-modal-body";
    if (typeof content === "string") {
      body.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      body.appendChild(content);
    }

    panel.append(header, body);
    backdrop.appendChild(panel);
    document.body.appendChild(backdrop);
    modalBackdrop = backdrop;

    const close = () => closeModal(undefined);

    closeBtn.addEventListener("click", close);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) close();
    });

    modalKeyHandler = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener("keydown", modalKeyHandler);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        backdrop.classList.add("dh-modal-backdrop--open");
        panel.classList.add("dh-modal-panel--open");
      });
    });

    const focusable = panel.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable && typeof focusable.focus === "function") {
      focusable.focus();
    } else {
      closeBtn.focus();
    }
  });
}

export function confirmDialog(message, opts = {}) {
  const { okText = "OK", cancelText = "Cancel", title = "Confirm" } = opts;

  const wrap = document.createElement("div");
  wrap.className = "dh-confirm";

  const p = document.createElement("p");
  p.className = "dh-confirm-message";
  p.textContent = String(message ?? "");

  const actions = document.createElement("div");
  actions.className = "dh-modal-actions";

  const btnCancel = document.createElement("button");
  btnCancel.type = "button";
  btnCancel.className = "btn-secondary";
  btnCancel.textContent = cancelText;

  const btnOk = document.createElement("button");
  btnOk.type = "button";
  btnOk.className = "btn-primary";
  btnOk.textContent = okText;

  actions.append(btnCancel, btnOk);
  wrap.append(p, actions);

  const promise = openModal(wrap, { title });

  btnCancel.addEventListener("click", () => closeModal(false));
  btnOk.addEventListener("click", () => closeModal(true));

  return promise.then((v) => v === true);
}

function ensureLoaderElement(message) {
  if (loaderEl && document.body.contains(loaderEl)) {
    const text = loaderEl.querySelector(".dh-loader-text");
    if (text && message) text.textContent = message;
    return loaderEl;
  }

  const root = document.createElement("div");
  root.id = "dh-fullpage-loader";
  root.className = "dh-fullpage-loader";
  root.setAttribute("role", "status");
  root.setAttribute("aria-live", "polite");
  root.setAttribute("aria-busy", "true");

  const inner = document.createElement("div");
  inner.className = "dh-loader-inner";

  const spinner = document.createElement("div");
  spinner.className = "dh-loader-spinner";
  spinner.setAttribute("aria-hidden", "true");

  const text = document.createElement("p");
  text.className = "dh-loader-text";
  text.textContent = message || "Loading…";

  inner.append(spinner, text);
  root.appendChild(inner);
  document.body.appendChild(root);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => root.classList.add("dh-fullpage-loader--visible"));
  });

  loaderEl = root;
  return root;
}

export function showLoader(message = "") {
  loaderDepth += 1;
  ensureLoaderElement(message);
}


export function hideLoader() {
  loaderDepth = Math.max(0, loaderDepth - 1);
  if (loaderDepth > 0) return;

  if (!loaderEl?.isConnected) {
    loaderEl = null;
    return;
  }

  const el = loaderEl;
  loaderEl = null;
  el.classList.remove("dh-fullpage-loader--visible");
  const done = () => {
    el.remove();
  };
  el.addEventListener("transitionend", done, { once: true });
  window.setTimeout(done, 220);
}
