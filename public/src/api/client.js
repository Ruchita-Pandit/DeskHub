const BASE_URL = "http://localhost:3001";

async function request(
  endpoint,
  options = {}
) {

  const response = await fetch(
    BASE_URL + endpoint,
    {
      headers: {
        "Content-Type":
          "application/json",
      },

      ...options,
    }
  );

  if (!response.ok) {

    let errorMessage =
      "Something went wrong";

    try {
      const errorData =
        await response.json();

      errorMessage =
        errorData.message ||
        errorMessage;

    } catch (err) {}

    throw new Error(errorMessage);
  }

  return response.json();
}

export function get(endpoint) {
  return request(endpoint);
}

export function post(endpoint, data) {
  return request(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function patch(endpoint, data) {
  return request(endpoint, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function del(endpoint) {
  return request(endpoint, {
    method: "DELETE",
  });
}