export function formatDateYearMonthDay(date) {
    let day = date.getDate().toString();
    day = day.length === 1 ? `0${day}` : day;
    let month = (date.getMonth() + 1).toString();
    month = month.length === 1 ? `0${month}` : month;
    return `${date.getFullYear()}-${month}-${day}`;
}

export function formatDateToReadableFormat(date) {
    let day = date.getDate().toString();
    day = day.length === 1 ? `0${day}` : day;
    let month = (date.getMonth() + 1).toString();
    month = month.length === 1 ? `0${month}` : month;
    return `${day}/${month}/${date.getFullYear()}`;
}

export function formatDateToReadableDateFormat(date) {
    let day = date.getDate().toString();
    day = day.length === 1 ? `0${day}` : day;

    let month = (date.getMonth() + 1).toString();
    month = month.length === 1 ? `0${month}` : month;

    let minutes = date.getMinutes().toString();
    minutes = minutes.length === 1 ? `0${minutes}` : minutes;
    return `${day}/${month}`;
}

export function formatDateToReadableDateAndTimeFormat(date) {
    return `${formatDateToReadableFormat(
        date
    )} à ${formatDateToReadableTimeFormat(date)}`;
}

export function formatDateToReadableTimeFormat(date, separator = ":") {
    let minutes = date.getMinutes().toString();
    minutes = minutes.length === 1 ? `0${minutes}` : minutes;

    const hour = date.getHours();
    return `${hour}${separator}${minutes}`;
}

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
    const frenchMonth = [
        "janvier",
        "février",
        "mars",
        "avril",
        "mai",
        "juin",
        "juillet",
        "aout",
        "septembre",
        "octobre",
        "novembre",
        "décembre",
    ];
    const day = date.getDate().toString();
    const month = frenchMonth[date.getMonth()];
    let res = `${day} ${month}`;
    console.log(res);
    if (withYear) {
        res = `${res} ${date.getFullYear()}`;
    }
    if (withTime) {
        res = `${res} à ${formatDateToReadableTimeFormat(date, "h")}`;
    }
    console.log(res);
    return res;
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
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    monday.setSeconds(0, 0);
    return monday;
}

export function addDays(date, days, week = null) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export function durationBetweenDate(date1: Date, date2: Date) {
    const differenceMs = date1.getTime() - date2.getTime();
    const heures = Math.floor(differenceMs / 3600000); // Total d'heures
    const restantMs = differenceMs % 3600000; // Reste en millisecondes
    const secondes = Math.floor(restantMs / 1000); // Convertir le reste en secondes
    const formatHeure = (heure) => heure.toString().padStart(2, "0");
    const heuresFormat = formatHeure(heures);
    const secondesFormat = formatHeure(secondes);

    const result = `${
        heuresFormat[0] === "0" ? heuresFormat[1] : heuresFormat
    }h${secondesFormat === "00" ? "" : secondesFormat}`;
    return result;
}
