import {
    get,
    post,
    patch,
    del
}
from "./client.js";

export function listTickets(){

    return get("/tickets");
}

export function getTicket(id){

    return get(`/tickets/${id}`);
}

export function createTicket(data){

    return post("/tickets", data);
}

export function updateTicket(id, data){

    return patch(`/tickets/${id}`, data);
}

export function deleteTicket(id){

    return del(`/tickets/${id}`);
}

export function listComments(ticketId){

    return get(
        `/comments?ticketId=${ticketId}`
    );
}

export function addComment(data){

    return post("/comments", data);
}

export function listUsers(){

    return get("/users");
}