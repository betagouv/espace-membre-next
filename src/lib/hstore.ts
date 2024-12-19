import { flatten, unflatten } from "@/lib/flat";

// Safely convert input into a string and escape problematic characters
function to_string(input) {
    switch (typeof input) {
        case "boolean":
        case "number":
        case "object":
            return String(input);
        case "string":
            return input;
        default:
            return "";
    }
}

// Escape special characters like backslashes and double quotes
function escape_string(input) {
    if (input === null || input === undefined) return "NULL";
    return String(input)
        .replace(/\\/g, "\\\\") // Escape backslashes
        .replace(/"/g, '\\"'); // Escape double quotes
}

// Unescape the string when parsing HSTORE
function unescape_string(input) {
    if (input === "NULL") return null;
    return String(input)
        .replace(/\\"/g, '"') // Unescape double quotes
        .replace(/\\\\/g, "\\"); // Unescape backslashes
}

export const stringify = function (data) {
    const flattenData = flatten(data, undefined);
    const hstore = Object.keys(flattenData).map((key) => {
        const keyStr = escape_string(to_string(key));
        const value = flattenData[key];
        if (value === null || value === undefined) {
            return `"${keyStr}"=>NULL`;
        } else {
            const valueStr = escape_string(to_string(value));
            return `"${keyStr}"=>"${valueStr}"`;
        }
    });
    return hstore.join();
};

export const parse = function (string) {
    const result = {};

    // Regular expression to match key=>value pairs, including those with escaped quotes and NULL values
    const regex = /"((?:\\.|[^"])*)"=>(NULL|"((?:\\.|[^"])*)")/g;
    let match;

    while ((match = regex.exec(string)) !== null) {
        const key = unescape_string(match[1]);
        const value = match[2] === "NULL" ? null : unescape_string(match[3]);
        if (key) {
            result[key] = value;
        }
    }

    return unflatten(result, undefined);
};
