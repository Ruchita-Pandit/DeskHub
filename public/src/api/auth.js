import { get } from "./client.js";

import * as storage from "../utils/storage.js";

export async function login(email, password){

    const users = await get(
        `/users?email=${email}`
    );

    const user = users[0];

    if(!user){

        throw new Error(
            "User not found"
        );
    }

    if(user.password !== password){

        throw new Error(
            "Invalid password"
        );
    }

    const token = crypto.randomUUID();

    storage.set("token", token);

    storage.set("user", user);

    return user;
}

export function logout(){

    storage.clear();
}

export function getCurrentUser(){

    return storage.get("user");
}

export function isAuthenticated(){

    return !!storage.get("token");
}