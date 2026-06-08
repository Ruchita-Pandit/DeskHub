export function formatDate(dateString){

    const date =
        new Date(dateString);

    return new Intl.DateTimeFormat(
        "en-IN",
        {
            day:"numeric",
            month:"short",
            year:"numeric"
        }
    ).format(date);
}

export function formatDateTime(dateString){

    const date =
        new Date(dateString);

    return new Intl.DateTimeFormat(
        "en-IN",
        {
            day:"numeric",
            month:"short",
            year:"numeric",
            hour:"numeric",
            minute:"numeric"
        }
    ).format(date);
}

export function formatRelative(dateString){

    const date =
        new Date(dateString);

    return date.toLocaleDateString();
}
