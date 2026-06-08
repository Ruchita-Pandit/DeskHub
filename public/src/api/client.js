const BASE_URL = "https://deskhub-ebnt.onrender.com";

async function request(endpoint, options = {}){

    const response = await fetch(
        BASE_URL + endpoint,
        {
            headers:{
                "Content-Type":"application/json"
            },

            ...options
        }
    );

    if(!response.ok){

        throw new Error(
            "Request Failed"
        );
    }

    const data =
    await response.json();

return {
    data,
    headers: response.headers
};
}

export function get(endpoint){

    return request(endpoint);
}

export function post(endpoint, data){

    return request(endpoint,{

        method:"POST",

        body:JSON.stringify(data)
    });
}

export function patch(endpoint, data){

    return request(endpoint,{

        method:"PATCH",

        body:JSON.stringify(data)
    });
}

export function del(endpoint){

    return request(endpoint,{
        method:"DELETE"
    });
}