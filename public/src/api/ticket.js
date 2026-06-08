import {
    get,
    post,
    patch,
    del
}
from "./client.js";

export function listTickets(params = {}){

    const query =
        new URLSearchParams();

    if(params.search){

        query.append(
            "q",
            params.search
        );
    }

    if(params.status){

        query.append(
            "status",
            params.status
        );
    }

    if(params.priority){

        query.append(
            "priority",
            params.priority
        );
    }

    query.append(
        "_sort",
        "createdAt"
    );

    query.append(
        "_order",
        params.order || "desc"
    );

    query.append(
        "_page",
        params.page || 1
    );

    query.append(
        "_limit",
        10
    );

    return get(
        `/tickets?${query.toString()}`
    );
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