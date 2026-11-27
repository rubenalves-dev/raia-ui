import { FieldBindProps } from "../utils";

export interface CalendarDay {
  date: Date;
  isoDate: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

export interface DatePickerProps extends FieldBindProps<string> {
  format?: string;
  placeholder?: string;
  required?: boolean;
  name?: string;
  clearable?: boolean;

  onOpen?: () => void;
  onClose?: () => void;
}

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const WEEK_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
