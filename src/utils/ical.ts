export interface CalEvent {
    type: "VEVENT";
    uid: string;
    summary: string;
    description?: string;
    location?: string;
    start: Date;
    end: Date;
}

export type CalendarResponse = Record<string, CalEvent>;

function unescapeValue(value: string): string {
    return value
        .replace(/\\n/gi, "\n")
        .replace(/\\,/g, ",")
        .replace(/\\\\/g, "\\");
}

function parseICSDate(value: string): Date {
    const isUTC = value.endsWith("Z");
    const clean = value.replace("Z", "");

    if (clean.includes("T")) {
        const datePart = clean.substring(0, 8);
        const timePart = clean.substring(9);
        const year = parseInt(datePart.substring(0, 4), 10);
        const month = parseInt(datePart.substring(4, 6), 10) - 1;
        const day = parseInt(datePart.substring(6, 8), 10);
        const hour = parseInt(timePart.substring(0, 2), 10);
        const minute = parseInt(timePart.substring(2, 4), 10);
        const second = parseInt(timePart.substring(4, 6), 10);
        return isUTC
            ? new Date(Date.UTC(year, month, day, hour, minute, second))
            : new Date(year, month, day, hour, minute, second);
    }

    const year = parseInt(clean.substring(0, 4), 10);
    const month = parseInt(clean.substring(4, 6), 10) - 1;
    const day = parseInt(clean.substring(6, 8), 10);
    return new Date(year, month, day);
}

export function parseICS(icsText: string): CalendarResponse {
    const unfolded = icsText.replace(/\r?\n[ \t]/g, "");
    const lines = unfolded.split(/\r?\n/);

    const result: CalendarResponse = {};
    let current: Record<string, string> | null = null;

    for (const line of lines) {
        if (line === "BEGIN:VEVENT") {
            current = {};
        } else if (line === "END:VEVENT" && current !== null) {
            const uid =
                current["UID"] || `event-${Object.keys(result).length}`;
            const dtstart = current["DTSTART"] ?? "";
            const dtend = current["DTEND"] ?? "";
            result[uid] = {
                type: "VEVENT",
                uid,
                summary: unescapeValue(current["SUMMARY"] ?? ""),
                description: current["DESCRIPTION"]
                    ? unescapeValue(current["DESCRIPTION"])
                    : undefined,
                location: current["LOCATION"]
                    ? unescapeValue(current["LOCATION"])
                    : undefined,
                start: parseICSDate(dtstart),
                end: parseICSDate(dtend),
            };
            current = null;
        } else if (current !== null) {
            const colonIdx = line.indexOf(":");
            if (colonIdx > 0) {
                const propName = line.substring(0, colonIdx).split(";")[0];
                const value = line.substring(colonIdx + 1);
                current[propName] = value;
            }
        }
    }

    return result;
}
