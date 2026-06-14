const BASE_URL = "https://deskhub-ebnt.onrender.com";

async function request(endpoint, options = {}) {
  const response = await fetch(BASE_URL + endpoint, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error("Request Failed");
  }

  const data = await response.json();

  return {
    data,
    headers: response.headers,
  };
}

/** Returns parsed JSON and response headers (needed for X-Total-Count pagination). */
export async function get(endpoint) {
  return request(endpoint);
}

export async function post(endpoint, data) {
  const { data: out } = await request(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return out;
}

export async function patch(endpoint, data) {
  const { data: out } = await request(endpoint, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return out;
}

export async function del(endpoint) {
  const { data: out } = await request(endpoint, {
    method: "DELETE",
  });
  return out;
}
