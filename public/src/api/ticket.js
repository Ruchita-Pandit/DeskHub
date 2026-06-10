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

    const term =
        typeof params.search === "string"
            ? params.search.trim()
            : "";

    if(term){

        const where = {};

        if(params.status){

            where.status = {
                eq: params.status
            };
        }

        if(params.priority){

            where.priority = {
                eq: params.priority
            };
        }

        where.or = [
            {
                title:{
                    contains: term
                }
            },
            {
                description:{
                    contains: term
                }
            },
            {
                customerName:{
                    contains: term
                }
            },
            {
                customerEmail:{
                    contains: term
                }
            }
        ];

        query.set(
            "_where",
            JSON.stringify(where)
        );
    }
    else{

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
    }

    const sortField =
        params.order === "asc"
            ? "createdAt"
            : "-createdAt";

    query.set(
        "_sort",
        sortField
    );

    query.set(
        "_page",
        String(
            params.page || 1
        )
    );

    query.set(
        "_per_page",
        "10"
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