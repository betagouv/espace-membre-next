import { flatten, unflatten } from "@/lib/flat";

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

export const stringify = function (data: any) {
    const flattenData = flatten(data, undefined);
    var hstore = Object.keys(flattenData).map(function (key) {
        if (flattenData[key] === null) {
            return '"' + to_string(key) + '"=>NULL';
        } else {
            return (
                '"' +
                to_string(key) +
                '"=>"' +
                to_string(flattenData[key]) +
                '"'
            );
        }
    });
    var joined = hstore.join();
    return joined;
};

export const parse = function (string) {
    var result = {},
        //using [\s\S] to match any character, including line feed and carriage return,
        r = /(["])(?:\\\1|\\\\|[\s\S])*?\1|NULL/g,
        matches = string.match(r),
        i,
        l,
        clean = function (value) {
            // Remove leading double quotes
            value = value.replace(/^\"|\"$/g, "");
            // Unescape quotes
            value = value.replace(/\\"/g, '"');
            //Unescape backslashes
            value = value.replace(/\\\\/g, "\\");
            //Unescape single quotes
            value = value.replace(/''/g, "'");

            return value;
        };

    if (matches) {
        for (i = 0, l = matches.length; i < l; i += 2) {
            if (matches[i] && matches[i + 1]) {
                var key = clean(matches[i]);
                var value = matches[i + 1];
                result[key] = value == "NULL" ? null : clean(value);
            }
        }
    }
    return unflatten(result, undefined);
};
