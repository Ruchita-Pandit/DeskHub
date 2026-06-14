const PREFIX = "deskhub:";

export function get(key, defaultValue = null) {
    try {
        if(typeof localStorage === "undefined"){
            console.log("localStorage is not available");
            return defaultValue;
        }
        const prefixedKey = PREFIX + key;
        const item = localStorage.getItem(prefixedKey);

        if(item === null) return defaultValue;

        return JSON.parse(item);

    } catch (error) {
        console.warn(`failed to get storage item ${key}:`, error.message);
        return defaultValue;
    }
}

export function set(key, value) {
    try {
        if(typeof localStorage === "undefined"){
            console.log("localStorage is not available");
        }

        const prefixedKey = PREFIX + key;
        const serializedValue = JSON.stringify(value);

        localStorage.setItem(prefixedKey, serializedValue);
    } catch (error) {
        if(error.name === 'QuotaExceededError'){
            console.log("localStorage quota exceeded. Consider clearing old data")
        }
        else{
            console.warn(`failed to get storage item ${key}:`, error.message)
        }
    }
}

export function remove(key) {
    try {
        if(typeof localStorage === "undefined"){
            console.log("localStorage is not available");
        }
        const prefixedKey = PREFIX + key;
        localStorage.removeItem(prefixedKey);

    } catch (error) {
        console.warn(`Failed to remove storage item "${key}":`, error.message);
    }
}

export function clear() {
    try {
        if(typeof localStorage === "undefined"){
            console.log("localStorage is not available");
        }

        let clearedCount = 0;
        const keysToRemove = [];

        for(let i = 0; i < localStorage.length; i++){
            const key = localStorage.key(i);
            if(key && key.startsWith(PREFIX)){
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach((key)=>{
            localStorage.removeItem(key);
            clearedCount++;
        });

        console.log(`Cleared ${clearedCount} DeskHub storage items`);
    } catch (error) {
        console.warn('Failed to clear storage:', error.message);
    }
}
