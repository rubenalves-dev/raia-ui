import { FieldBindProps } from "../utils";

export type RadioGroupOrientation = "vertical" | "horizontal";

export interface RadioOption<T = string | number | boolean> {
  label: string;
  value: T;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps<
  T = string | number | boolean,
> extends FieldBindProps<T | null> {
  options: RadioOption<T>[];
  orientation?: RadioGroupOrientation;
  required?: boolean;
}
