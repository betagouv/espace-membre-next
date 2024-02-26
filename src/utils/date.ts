import { intervalToDuration, format, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";

export function nbOfDaysBetweenDate(date1: Date, date2: Date) {
    let difference = date1.getTime() - date2.getTime();
    let totalDays = Math.ceil(difference / (1000 * 3600 * 24));
    return Math.abs(totalDays);
}

export function formatDateToFrenchTextReadableFormat(
    date: Date,
    withYear: boolean = true,
    withTime: boolean = false
) {
    // Format de base pour la date en français
    let formatStr = "d MMMM";
    if (withYear) {
        formatStr += " yyyy";
    }
    if (withTime) {
        // Utilisez 'HH:mm' pour un format 24h ou 'hh:mm a' pour un format 12h avec AM/PM
        formatStr += " 'à' HH:mm";
    }

    // Formate la date avec le format spécifié et le locale français
    return format(date, formatStr, { locale: fr });
}

export const NUMBER_OF_DAY_IN_A_WEEK = 7;

export const NUMBER_OF_DAY_FROM_MONDAY = {
    MONDAY: 0,
    TUESDAY: 1,
    WEDNESDAY: 2,
    THURSDAY: 3,
    FRIDAY: 4,
};

export function getMonday(d) {
    const today = new Date();
    // Get the start of this week, considering Monday as the first day of the week
    const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });

    return startOfThisWeek;
}

export function addDays(date, days, week = null) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export function durationBetweenDate(date1: Date, date2: Date) {
    const duration = intervalToDuration({ start: date2, end: date1 });
    let result = "";
    if (duration.hours !== undefined) {
        result += `${duration.hours.toString()}h`;
    }
    if (duration.seconds !== undefined && duration.seconds > 0) {
        result += `${duration.seconds.toString().padStart(2, "0")}`;
    }
    return result;
}
