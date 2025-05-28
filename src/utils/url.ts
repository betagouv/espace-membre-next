import { isBrowser } from "./platform";

export function getBaseUrl() {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL;
  } else if (process.env.NEXT_PUBLIC_APP_BASE_URL) {
    return process.env.NEXT_PUBLIC_APP_BASE_URL;
  } else if (isBrowser) {
    return "";
  }

  return `http://localhost:${process.env.PORT ?? getListeningPort()}`;
}

export function getListeningPort() {
  return process.env.PORT ?? 3000;
}

export function hasPathnameThisRoot(
  pathname: string | null,
  rootPathname: string,
): boolean {
  if (!pathname) {
    return false;
  }

  return pathname.startsWith(rootPathname);
}

export function hasPathnameThisMatch(
  pathname: string | null,
  rootPathname: string,
): boolean {
  if (!pathname) {
    return false;
  }

  return pathname === rootPathname;
}

export function hasPathnameThisRegex(
  pathname: string | null,
  regexPathname: string,
): boolean {
  if (!pathname) {
    return false;
  }
  const patternString: string = regexPathname; // Matches one or more digits
  // Convert the string to a RegExp object
  const regex: RegExp = new RegExp(patternString);

  return regex.test(pathname);
}

type SearchParamsValueType = boolean | number | string | null;
export function convertSearchParamsToRecord(
  searchParams: URLSearchParams,
): Record<string, SearchParamsValueType | SearchParamsValueType[]> {
  const result: Record<
    string,
    SearchParamsValueType | SearchParamsValueType[]
  > = {};
  Array.from(searchParams.entries()).forEach(([key, value]) => {
    let valueToSet: SearchParamsValueType;
    if (value === "true") {
      valueToSet = true;
    } else if (value === "false") {
      valueToSet = false;
    } else if (value === "null") {
      valueToSet = null;
    } else if (!isNaN(Number(value))) {
      valueToSet = Number(value);
    } else {
      valueToSet = value;
    }

    if (key in result) {
      if (Array.isArray(result[key])) {
        result[key].push(valueToSet);
      } else {
        result[key] = [result[key], valueToSet];
      }
    } else {
      result[key] = valueToSet;
    }
  });
  return result;
}
