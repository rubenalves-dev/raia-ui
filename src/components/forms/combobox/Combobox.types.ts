import { FieldBindProps } from "../utils";

export interface ComboboxOption<T = unknown> {
  label: string;
  value: string | number;
  disabled?: boolean;
  raw?: T;
}

export interface ComboboxProps<T = unknown> extends FieldBindProps<
  string | number | null
> {
  options: ComboboxOption<T>[];
  placeholder?: string;
  filterFn?: (option: ComboboxOption<T>, search: string) => ComboboxOption<T>[];
  clearable?: boolean;

  onSelect?: (option: ComboboxOption<T> | null) => void;
  onSearch?: (query: string) => void;
}
