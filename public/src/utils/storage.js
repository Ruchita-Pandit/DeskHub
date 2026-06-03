const PREFIX = "deskhub:";

export function set(key, value) {
  localStorage.setItem(
    PREFIX + key,
    JSON.stringify(value)
  );
}

export function get(key) {
  const value =
    localStorage.getItem(PREFIX + key);

  return value
    ? JSON.parse(value)
    : null;
}

export function remove(key) {
  localStorage.removeItem(PREFIX + key);
}

export function clear() {
  Object.keys(localStorage)
    .filter((key) =>
      key.startsWith(PREFIX)
    )
    .forEach((key) =>
      localStorage.removeItem(key)
    );
}