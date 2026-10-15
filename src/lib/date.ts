import { format } from "date-fns";

export const NUMBER_OF_DAY_IN_A_WEEK = 7;

export const NUMBER_OF_DAY_FROM_MONDAY = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
};

export function frenchSmallDate(str) {
  try {
    return format(str, "dd/MM/yyyy");
  } catch (e) {
    return "?";
  }
}
