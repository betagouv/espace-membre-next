import { format, intervalToDuration } from "date-fns";

export const NUMBER_OF_DAY_IN_A_WEEK = 7;

export const NUMBER_OF_DAY_FROM_MONDAY = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
};

export function durationBetweenDate(date1: Date, date2: Date) {
  const duration = intervalToDuration({ start: date2, end: date1 });
  let result = "";
  if (duration.hours !== undefined) {
    result += `${duration.hours.toString()}h`;
  }
  if (duration.minutes !== undefined && duration.minutes > 0) {
    result += `${duration.minutes.toString().padStart(2, "0")}`;
  }
  return result;
}

export function frenchSmallDate(str) {
  try {
    return format(str, "dd/MM/yyyy");
  } catch (e) {
    return "?";
  }
}
