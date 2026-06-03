import { post } from "./client.js";

import {
  set,
  get,
  remove,
} from "../utils/storage.js";

const USER_KEY = "user";

export async function login(
  email,
  password
) {

  const response =
    await post("/login", {
      email,
      password,
    });

  set(USER_KEY, response);

  return response;
}

export function logout() {
  remove(USER_KEY);
}

export function getCurrentUser() {
  return get(USER_KEY);
}

export function isAuthenticated() {
  return !!get(USER_KEY);
}