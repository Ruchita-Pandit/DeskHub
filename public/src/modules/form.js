function runValidators(value, validators) {
  for (const fn of validators) {
    const r = fn(value);
    if (r !== true) return r;
  }
  return true;
}

export function required(msg = "Required") {
  return (v) => {
    const s = v == null ? "" : String(v).trim();
    return s.length > 0 ? true : msg;
  };
}


export function minLength(n, msg) {
  return (v) => {
    const s = v == null ? "" : String(v).trim();
    return s.length >= n ? true : msg ?? `At least ${n} characters`;
  };
}


export function maxLength(n, msg) {
  return (v) => {
    const s = v == null ? "" : String(v);
    return s.length <= n ? true : msg ?? `At most ${n} characters`;
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


export function email(msg = "Invalid email") {
  return (v) => {
    const s = v == null ? "" : String(v).trim();
    if (!s) return true;
    return EMAIL_RE.test(s) ? true : msg;
  };
}


export function oneOf(allowed, msg) {
  const set = new Set(allowed);
  return (v) => {
    const s = v == null ? "" : String(v);
    return set.has(s) ? true : msg ?? `Must be one of: ${allowed.join(", ")}`;
  };
}


function getFieldValue(el) {
  if (el instanceof HTMLInputElement && el.type === "checkbox") {
    return el.checked;
  }
  if ("value" in el) {
    return el.value;
  }
  return "";
}


function getOrCreateErrorEl(inputEl) {
  const next = inputEl.nextElementSibling;
  if (next instanceof HTMLElement && next.classList.contains("field-error")) {
    return next;
  }
  const span = document.createElement("span");
  span.className = "field-error";
  span.setAttribute("role", "alert");
  inputEl.insertAdjacentElement("afterend", span);
  return span;
}


export function validateField(inputEl, validators) {
  const value = getFieldValue(inputEl);
  const failed = runValidators(value, validators);
  const message = failed === true ? "" : failed;

  const errEl = getOrCreateErrorEl(inputEl);
  errEl.textContent = message;
  errEl.hidden = message === "";

  inputEl.setAttribute("aria-invalid", message ? "true" : "false");

  return message === "" ? true : message;
}


export function validateForm(formEl, fieldRules) {
  const errors = {};
  let isValid = true;

  for (const [fieldName, validators] of Object.entries(fieldRules)) {
    const item = formEl.elements.namedItem(fieldName);
    const control =
      item instanceof RadioNodeList ? item.item(0) : item;

    if (
      !control ||
      (!(control instanceof HTMLInputElement) &&
        !(control instanceof HTMLTextAreaElement) &&
        !(control instanceof HTMLSelectElement))
    ) {
      continue;
    }

    const result = validateField(control, validators);
    if (result !== true) {
      isValid = false;
      errors[fieldName] = result;
    }
  }

  return { isValid, errors };
}


export function isFormSatisfiesRules(formEl, fieldRules) {
  for (const [fieldName, validators] of Object.entries(fieldRules)) {
    const item = formEl.elements.namedItem(fieldName);
    const control =
      item instanceof RadioNodeList ? item.item(0) : item;

    if (
      !control ||
      (!(control instanceof HTMLInputElement) &&
        !(control instanceof HTMLTextAreaElement) &&
        !(control instanceof HTMLSelectElement))
    ) {
      continue;
    }

    const value = getFieldValue(control);
    if (runValidators(value, validators) !== true) {
      return false;
    }
  }
  return true;
}
