import {
  format as formatDate,
  differenceInDays,
  startOfWeek,
  addDays,
} from "date-fns";

// date-fns 래퍼 함수들
export { differenceInDays, startOfWeek, addDays };

export const format = (date: Date, formatStr: string): string => {
  return formatDate(date, formatStr);
};
