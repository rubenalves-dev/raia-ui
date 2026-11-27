import { Accessor, createContext, omit, useContext } from "solid-js";
import type { FieldNode } from "./types";

export interface FormFieldContextValue {
  id: string;
  field?: FieldNode<any>;
  invalid: Accessor<boolean>;
  disabled: Accessor<boolean>;
}

export const FormFieldContext = createContext<FormFieldContextValue | null>(
  null,
);

export interface FieldBindProps<T> {
  id?: string;
  field?: FieldNode<T>;
  value?: T;
  disabled?: boolean;
  invalid?: boolean;
  onChange?: (value: T) => void;
  onBlur?: () => void;
}

export function useField<T>(props: FieldBindProps<T>) {
  const ctx = useContext(FormFieldContext);
  const fallbackId = `v-field-${Math.random().toString(36).slice(2, 9)}`;
  const node = () => props.field ?? (ctx?.field as FieldNode<T> | undefined);

  return {
    id: () => props.id ?? ctx?.id ?? fallbackId,
    value: () => (node() ? node()!().value() : (props.value as T)),
    disabled: () =>
      Boolean(props.disabled ?? node()?.().disabled() ?? ctx?.disabled()),
    invalid: () =>
      Boolean(props.invalid ?? node()?.().invalid() ?? ctx?.invalid()),
    set: (next: T) => {
      node()?.().set(next);
      props.onChange?.(next);
    },
    onBlur: () => {
      node()?.().markTouched();
      props.onBlur?.();
    },
  };
}

export const FIELD_BIND_KEYS = [
  "id",
  "field",
  "value",
  "disabled",
  "invalid",
  "onChange",
  "onBlur",
] as const;

export function omitFieldProps<
  P extends FieldBindProps<any>,
  K extends keyof P = never,
>(props: P, ...extraKeys: K[]) {
  return omit(props, ...FIELD_BIND_KEYS, ...extraKeys);
}
