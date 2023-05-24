import format from "date-fns/format";

export const printDate = (date: Date) => {
  return format(date, "E do MMM" /* Mon 1st Jan */);
};
