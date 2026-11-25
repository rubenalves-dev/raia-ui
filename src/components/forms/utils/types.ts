import type { Accessor } from "solid-js";

export type SetterFn<T> = (prev: T) => T;
export type Setter<T> = T | SetterFn<T>;

export interface ValidationError {
  kind: string;
  message: string;
}

export interface ValidationContext<T> {
  readonly value: T;
  readonly valueOf: <V>(path: FieldPath<V>) => V;
}

export type FieldValidator<T> = (
  ctx: ValidationContext<T>,
) => ValidationError | null;

export type AsyncFieldValidator<T> = (
  ctx: ValidationContext<T>,
) => Promise<ValidationError | null>;

export type BuiltinLeaf =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | null
  | undefined
  | Date
  | RegExp
  | File
  | Blob
  | ((...args: any[]) => any);

export type DeepPartial<T> = T extends readonly (infer Item)[]
  ? Item[]
  : T extends BuiltinLeaf
    ? T
    : T extends Record<string, unknown>
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T;

export interface FieldState<T> {
  readonly value: Accessor<T>;
  readonly set: (next: Setter<T>) => void;

  readonly touched: Accessor<boolean>;
  readonly dirty: Accessor<boolean>;
  readonly disabled: Accessor<boolean>;
  readonly pending: Accessor<boolean>;
  readonly errors: Accessor<ValidationError[]>;
  readonly firstError: Accessor<string | null>;
  readonly valid: Accessor<boolean>;
  readonly invalid: Accessor<boolean>;

  readonly markTouched: () => void;
  readonly setDisabled: (disabled: boolean) => void;
  readonly reset: (next?: T) => void;
}

export type FieldNode<T> = () => FieldState<T>;

export interface GroupState<T> {
  readonly value: Accessor<T>;
  readonly valid: Accessor<boolean>;
  readonly invalid: Accessor<boolean>;
  readonly dirty: Accessor<boolean>;
  readonly touched: Accessor<boolean>;
  readonly pending: Accessor<boolean>;
}

export interface ArrayState<Item> extends GroupState<Item[]> {
  readonly errors: Accessor<ValidationError[]>;
  readonly firstError: Accessor<string | null>;
  readonly nodes: Accessor<FieldTree<Item>[]>;
  readonly push: (item: Item) => void;
  readonly insertAt: (index: number, item: Item) => void;
  readonly removeAt: (index: number) => void;
  readonly move: (from: number, to: number) => void;
  readonly set: (next: Item[]) => void;
  readonly markTouched: () => void;
  readonly reset: (next?: Item[]) => void;
}

export type FieldTree<T> = T extends readonly (infer Item)[]
  ? () => ArrayState<Item>
  : T extends BuiltinLeaf
    ? FieldNode<T>
    : T extends Record<string, unknown>
      ? (() => GroupState<T>) & { readonly [K in keyof T]: FieldTree<T[K]> }
      : FieldNode<T>;

export interface RootFormState<T> extends GroupState<T> {
  readonly submitting: Accessor<boolean>;
}

export type FormTree<T extends Record<string, unknown>> =
  (() => RootFormState<T>) & {
    readonly [K in keyof T]: FieldTree<T[K]>;
  } & {
    readonly submit: (
      onValid: (values: T) => void | Promise<void>,
    ) => (event?: SubmitEvent) => Promise<void>;
    readonly reset: (next?: DeepPartial<T>) => void;
    readonly markAllTouched: () => void;
  };

export interface FieldPath<T> {
  readonly __validators: FieldValidator<T>[];
  readonly __asyncValidators: AsyncFieldValidator<T>[];
}

export interface ArrayPath<Item> extends FieldPath<Item[]> {
  readonly __itemSchemas: ((itemPath: SchemaPath<Item>) => void)[];
}

export type SchemaPath<T> = T extends readonly (infer Item)[]
  ? ArrayPath<Item>
  : T extends BuiltinLeaf
    ? FieldPath<T>
    : T extends Record<string, unknown>
      ? FieldPath<T> & { readonly [K in keyof T]: SchemaPath<T[K]> }
      : FieldPath<T>;

export interface InternalNodeControls {
  markAllTouched: () => void;
  reset: (next?: unknown) => void;
}
