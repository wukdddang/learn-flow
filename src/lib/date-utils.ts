import {
  format as formatDate,
  differenceInDays as diffDays,
  startOfWeek as startWeek,
  addDays as addDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isToday,
  isSameMonth,
  getMonth,
  getYear,
  Locale,
} from "date-fns";

// date-fns 래퍼 함수들
export const differenceInDays = diffDays;
export const startOfWeek = startWeek;
export const addDays = addDay;

export {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isToday,
  isSameMonth,
  getMonth,
  getYear,
};

export const format = (
  date: Date,
  formatStr: string,
  options?: { locale: Locale }
): string => {
  return formatDate(date, formatStr, options);
};
