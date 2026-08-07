function isBuffer(obj) {
  return (
    obj?.constructor?.isBuffer?.(obj) === true
  );
}

function keyIdentity(key) {
  return key;
}

function flatten(target, opts) {
  opts = opts || {};
  const delimiter = opts.delimiter || ".";
  const maxDepth = opts.maxDepth;
  const transformKey = opts.transformKey || keyIdentity;
  const output = {};

  function step(object, prev, currentDepth) {
    currentDepth = currentDepth || 1;
    Object.keys(object).forEach(function (key) {
      const value = object[key];
      const isarray = Array.isArray(value);
      const isbuffer = isBuffer(value);
      const type = Object.prototype.toString.call(value);
      const isobject = type === "[object Object]" || type === "[object Array]";

      const newKey = prev
        ? prev + delimiter + transformKey(key)
        : transformKey(key);

      if (
        !isarray &&
        !isbuffer &&
        isobject &&
        Object.keys(value).length &&
        (!opts.maxDepth || currentDepth < maxDepth)
      ) {
        return step(value, newKey, currentDepth + 1);
      }

      if (isarray) {
        output[newKey + "__isArray"] = true;
        value.forEach((item, index) => {
          step({ [index]: item }, newKey, currentDepth + 1);
        });
      } else {
        output[newKey] = value;
      }
    });
  }

  step(target, undefined, undefined);

  return output;
}

function unflatten(target, opts) {
  opts = opts || {};
  const delimiter = opts.delimiter || ".";
  const overwrite = opts.overwrite || false;
  const transformKey = opts.transformKey || keyIdentity;
  const result = {};

  const isbuffer = isBuffer(target);
  if (
    isbuffer ||
    Object.prototype.toString.call(target) !== "[object Object]"
  ) {
    return target;
  }

   function getkey(key) {
     const parsedKey = Number(key);
     return (Number.isNaN(parsedKey) || key.includes(".") || opts.object)
       ? key
       : parsedKey;
   }

  function addKeys(keyPrefix, recipient, target) {
    return Object.keys(target).reduce(function (result, key) {
      result[keyPrefix + delimiter + key] = target[key];
      return result;
    }, recipient);
  }

  function isEmpty(val) {
    const type = Object.prototype.toString.call(val);
    const isArray = type === "[object Array]";
    const isObject = type === "[object Object]";

    if (!val) {
      return true;
    } else if (isArray) {
      return !val.length;
    } else if (isObject) {
      return !Object.keys(val).length;
    }
  }

  Object.keys(target).forEach((key) => {
    if (key.endsWith("__isArray")) {
      const baseKey = key.slice(0, -9);
      if (!result[baseKey]) result[baseKey] = [];
    }
  });

  target = Object.keys(target).reduce(function (result, key) {
    const type = Object.prototype.toString.call(target[key]);
    const isObject = type === "[object Object]" || type === "[object Array]";
    if (!isObject || isEmpty(target[key])) {
      result[key] = target[key];
      return result;
    } else {
      return addKeys(key, result, flatten(target[key], opts));
    }
  }, {});

  Object.keys(target).forEach(function (key) {
    if (key === "__proto__") {
      return;
    }

    const split = key.split(delimiter).map(transformKey);
    let key1 = getkey(split.shift());
    let key2 = getkey(split[0]);
    let recipient = result;

    processKeyPath();

    if (key.endsWith("__isArray")) {
      const baseKey = key.slice(0, -9);
      if (!result[baseKey]) result[baseKey] = [];
    } else {
      recipient[key1] = unflatten(target[key], opts);
    }

    function processKeyPath() {
      while (key2 !== undefined) {
        if (key1 === "__proto__") {
          return;
        }

        const type = Object.prototype.toString.call(recipient[key1]);
        const isobject = type === "[object Object]" || type === "[object Array]";

        if (!overwrite && !isobject && recipient[key1] !== undefined) {
          return;
        }

        if ((overwrite && !isobject) || (!overwrite && recipient[key1] == null)) {
          recipient[key1] = isArrayKey(key2) ? [] : {};
        }

        recipient = recipient[key1];
        if (split.length > 0) {
          key1 = getkey(split.shift());
          key2 = getkey(split[0]);
        }
      }
    }

    function isArrayKey(key2) {
      return typeof key2 === "number" && !opts.object;
    }
  });

  return result;
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

function escape_string(input) {
  if (input === null || input === undefined) return "NULL";
  return String(input).replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function unescape_string(input) {
  if (input === "NULL") return null;
  return String(input).replaceAll('\\"', '"').replaceAll("\\\\", "\\");
}
