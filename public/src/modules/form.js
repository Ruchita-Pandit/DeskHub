export function required(value){

    const v =
        value === null || value === undefined
            ? ""
            : String(value).trim();

    if(v === ""){

        return "This field is required";
    }

    return null;
}

export function minLength(min){

    return (value)=>{

        const v =
            value === null || value === undefined
                ? ""
                : String(value);

        if(v.length < min){

            return `Must be at least ${min} characters`;
        }

        return null;
    };
}

export function maxLength(max){

    return (value)=>{

        const v =
            value === null || value === undefined
                ? ""
                : String(value);

        if(v.length > max){

            return `Must be at most ${max} characters`;
        }

        return null;
    };
}

const EMAIL_RE =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function email(value){

    const v =
        value === null || value === undefined
            ? ""
            : String(value).trim();

    if(v === ""){

        return null;
    }

    if(!EMAIL_RE.test(v)){

        return "Enter a valid email address";
    }

    return null;
}

export function oneOf(allowed){

    const set =
        new Set(allowed);

    return (value)=>{

        if(value === "" || value === null || value === undefined){

            return null;
        }

        if(!set.has(value)){

            return "Invalid choice";
        }

        return null;
    };
}

export function validateField(value, rules){

    if(!rules || rules.length === 0){

        return null;
    }

    for(const rule of rules){

        const message =
            rule(value);

        if(message){

            return message;
        }
    }

    return null;
}

export function validateForm(fieldRules, getValue){

    const errors = {};

    let valid =
        true;

    for(const [field, rules] of Object.entries(fieldRules)){

        const message =
            validateField(
                getValue(field),
                rules
            );

        if(message){

            errors[field] = message;

            valid = false;
        }
    }

    return {
        valid,
        errors
    };
}
