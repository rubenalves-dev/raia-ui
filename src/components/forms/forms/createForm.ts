import {
  Accessor,
  createContext,
  createMemo,
  createSignal,
  useContext,
} from "solid-js";

export type SetterFn<T> = (prev: T) => T;
export type Setter<T> = T | SetterFn<T>;

export interface ValidationError {
  kind: string;
  message: string;
}

export type FieldValidator<T> = (value: T) => ValidationError | null;

export interface FieldState<T> {
  readonly value: Accessor<T>;
  readonly set: (next: Setter<T>) => void;

  readonly touched: Accessor<boolean>;
  readonly dirty: Accessor<boolean>;
  readonly disabled: Accessor<boolean>;
  readonly errors: Accessor<ValidationError[]>;
  readonly firstError: Accessor<string | null>;
  readonly valid: Accessor<boolean>;
  readonly invalid: Accessor<boolean>;

  readonly markTouched: () => void;
  readonly setDisabled: (disabled: boolean) => void;
  readonly reset: (next?: T) => void;
  readonly inputProps: () => {
    value: string;
    disabled: boolean;
    "aria-invalid": boolean;
    onInput: (
      e: InputEvent & { currentTarget: HTMLInputElement | HTMLTextAreaElement },
    ) => void;
    onBlur: () => void;
  };
}

export type FieldNode<T> = () => FieldState<T>;

export interface RootFormState<T> {
  readonly value: Accessor<T>;
  readonly valid: Accessor<boolean>;
  readonly invalid: Accessor<boolean>;
  readonly dirty: Accessor<boolean>;
  readonly touched: Accessor<boolean>;
  readonly submitting: Accessor<boolean>;
}

export type FormTree<T extends Record<string, unknown>> =
  (() => RootFormState<T>) & {
    readonly [K in keyof T]: FieldNode<T[K]> & {
      readonly submit: (
        onValid: (values: T) => void | Promise<void>,
      ) => (event?: SubmitEvent) => Promise<void>;
      readonly reset: (next?: Partial<T>) => void;
      readonly markAllTouched: () => void;
    };
  };

export type SchemaPath<T> = {
  readonly [K in keyof T]: FieldPath<T[K]>;
};

export interface FieldPath<T> {
  readonly __validators: FieldValidator<T>[];
}

export function validate<T>(path: FieldPath<T>, fn: FieldValidator<T>): void {
  path.__validators.push(fn);
}

export function required<T>(
  path: FieldPath<T>,
  opts: { message?: string } = {},
): void {
  const message = opts.message ?? "This field is required";
  validate(path, (val) => {
    if (val === null || val === undefined) return { kind: "required", message };
    if (typeof val === "string" && val.trim() === "")
      return { kind: "required", message };
    if (Array.isArray(val) && val.length === 0)
      return { kind: "required", message };
    return null;
  });
}

export function minLength(
  path: FieldPath<string>,
  min: number,
  opts: { message?: string } = {},
): void {
  const message = opts.message ?? `Minimum ${min} characters`;
  validate(path, (val) =>
    val && val.length < min ? { kind: "minLength", message } : null,
  );
}

export function maxLength(
  path: FieldPath<string>,
  max: number,
  opts: { message?: string } = {},
): void {
  const message = opts.message ?? `Maximum ${max} characters`;
  validate(path, (val) =>
    val && val.length > max ? { kind: "maxLength", message } : null,
  );
}

export function email(
  path: FieldPath<string>,
  opts: { message?: string } = {},
): void {
  const message = opts.message ?? "Invalid email address";
  validate(path, (val) =>
    val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
      ? { kind: "email", message }
      : null,
  );
}

export function pattern(
  path: FieldPath<string>,
  regex: RegExp,
  opts: { message?: string } = {},
): void {
  const message = opts.message ?? "Invalid format";
  validate(path, (val) =>
    val && !regex.test(val) ? { kind: "pattern", message } : null,
  );
}

function createFieldNode<T>(
  initialValue: T,
  validators: FieldValidator<T>[],
): FieldNode<T> {
  let baseline = initialValue;

  const [value, setValue] = createSignal<T>(initialValue);
  const [touched, setTouched] = createSignal(false);
  const [disabled, setDisabled] = createSignal(false);

  const dirty = createMemo(() => !Object.is(value(), baseline));
  const errors = createMemo(() => {
    if (disabled()) return [];
    const current = value();
    const list: ValidationError[] = [];
    for (const rule of validators) {
      const err = rule(current);
      if (err) list.push(err);
    }
    return list;
  });

  const firstError = createMemo(() => errors().at(0)?.message ?? null);
  const valid = createMemo(() => errors().length === 0);
  const invalid = createMemo(() => touched() && !valid());

  const state: FieldState<T> = {
    value,
    set: (next) =>
      setValue((prev) =>
        typeof next === "function" ? (next as SetterFn<T>)(prev) : next,
      ),
    touched,
    dirty,
    disabled,
    errors,
    firstError,
    valid,
    invalid,
    markTouched: () => setTouched(true),
    setDisabled,
    reset: (next?: T) => {
      if (next !== undefined) baseline = next;
      setValue(() => baseline);
      setTouched(false);
    },
    inputProps: () => ({
      value: String(value() ?? ""),
      disabled: disabled(),
      "aria-invalid": invalid(),
      onInput: (e) => state.set(e.currentTarget.value as T),
      onBlur: () => setTouched(true),
    }),
  };

  return () => state;
}

export function createForm<T extends Record<string, unknown>>(
  initialModel: T,
  schema?: (path: SchemaPath<T>) => void,
): FormTree<T> {
  const keys = Object.keys(initialModel) as (keyof T)[];

  const paths = {} as { [K in keyof T]: FieldPath<T[K]> };
  for (const key of keys) {
    paths[key] = { __validators: [] };
  }
  schema?.(paths);

  const nodes = {} as { [K in keyof T]: FieldNode<T[K]> };
  for (const key of keys) {
    nodes[key] = createFieldNode(initialModel[key], paths[key].__validators);
  }

  const [submitting, setSubmitting] = createSignal(false);
  const value = createMemo<T>(() => {
    const out = {} as T;
    for (const key of keys) {
      out[key] = nodes[key]().value();
    }
    return out;
  });

  const valid = createMemo(() => keys.every((k) => nodes[k]().valid()));
  const invalid = createMemo(() => !valid());
  const dirty = createMemo(() => keys.some((k) => nodes[k]().dirty()));
  const touched = createMemo(() => keys.some((k) => nodes[k]().touched()));

  const rootState: RootFormState<T> = {
    value,
    valid,
    invalid,
    dirty,
    touched,
    submitting,
  };

  function markAllTouched(): void {
    for (const key of keys) nodes[key]().markTouched();
  }

  function reset(next?: Partial<T>): void {
    for (const key of keys) {
      nodes[key]().reset(next && key in next ? next[key] : undefined);
    }
  }

  function submit(onValid: (values: T) => void | Promise<void>) {
    return async (event?: SubmitEvent): Promise<void> => {
      event?.preventDefault();
      markAllTouched();
      if (!valid() || submitting()) return;

      try {
        setSubmitting(true);
        await onValid(value());
      } finally {
        setSubmitting(false);
      }
    };
  }

  const rootFn = (() => rootState) as FormTree<T>;
  Object.assign(rootFn, nodes, { submit, reset, markAllTouched });
  return rootFn;
}

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
