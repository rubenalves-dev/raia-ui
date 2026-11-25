import {
  Accessor,
  createContext,
  createEffect,
  createMemo,
  createRoot,
  createSignal,
  useContext,
} from "solid-js";

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

type BuiltinLeaf =
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

export function validate<T>(path: FieldPath<T>, fn: FieldValidator<T>): void {
  path.__validators.push(fn);
}

export function validateAsync<T>(
  path: FieldPath<T>,
  fn: AsyncFieldValidator<T>,
): void {
  path.__asyncValidators.push(fn);
}

export function applyEach<Item>(
  path: ArrayPath<Item>,
  fn: (itemPath: SchemaPath<Item>) => void,
): void {
  path.__itemSchemas.push(fn);
}

export function required<T>(
  path: FieldPath<T>,
  opts: { message?: string } = {},
): void {
  const message = opts.message ?? "This field is required";
  validate(path, ({ value }) => {
    if (value === null || value === undefined) {
      return { kind: "required", message };
    }
    if (typeof value === "string" && value.trim() === "") {
      return { kind: "required", message };
    }
    if (Array.isArray(value) && value.length === 0) {
      return { kind: "required", message };
    }
    return null;
  });
}

export function minLength(
  path: FieldPath<string>,
  min: number,
  opts: { message?: string } = {},
): void {
  const message = opts.message ?? `Minimum ${min} characters`;
  validate(path, ({ value }) =>
    value && value.length < min ? { kind: "minLength", message } : null,
  );
}

export function maxLength(
  path: FieldPath<string>,
  max: number,
  opts: { message?: string } = {},
): void {
  const message = opts.message ?? `Maximum ${max} characters`;
  validate(path, ({ value }) =>
    value && value.length > max ? { kind: "maxLength", message } : null,
  );
}

export function email(
  path: FieldPath<string>,
  opts: { message?: string } = {},
): void {
  const message = opts.message ?? "Invalid email address";
  validate(path, ({ value }) =>
    value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
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
  validate(path, ({ value }) =>
    value && !regex.test(value) ? { kind: "pattern", message } : null,
  );
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  if (typeof val !== "object" || val === null || Array.isArray(val)) {
    return false;
  }
  const proto = Object.getPrototypeOf(val);
  return proto === Object.prototype || proto === null;
}

function createFieldNode<T>(
  initialValue: T,
  validators: FieldValidator<T>[],
  asyncValidators: AsyncFieldValidator<T>[],
  valueOf: <V>(path: FieldPath<V>) => V,
): FieldNode<T> {
  const [baseline, setBaseline] = createSignal<T>(
    initialValue as Exclude<T, Function>,
  );

  const [value, setValue] = createSignal<T>(
    initialValue as Exclude<T, Function>,
  );
  const [touched, setTouched] = createSignal(false);
  const [disabled, setDisabled] = createSignal(false);
  const [asyncErrors, setAsyncErrors] = createSignal<ValidationError[]>([]);
  const [asyncPending, setAsyncPending] = createSignal(false);

  const dirty = createMemo(() => !Object.is(value(), baseline()));

  const syncErrors = createMemo(() => {
    if (disabled()) return [];
    const current = value();
    const ctx: ValidationContext<T> = { value: current, valueOf };
    const list: ValidationError[] = [];
    for (const rule of validators) {
      const err = rule(ctx);
      if (err) list.push(err);
    }
    return list;
  });

  if (asyncValidators.length > 0) {
    let runId = 0;
    createEffect(
      () => {
        if (disabled()) return null;
        const current = value();
        const ctx: ValidationContext<T> = { value: current, valueOf };
        return asyncValidators.map((rule) => rule(ctx));
      },
      (promises) => {
        const id = ++runId;
        if (!promises) {
          setAsyncPending(false);
          setAsyncErrors([]);
          return;
        }
        setAsyncPending(true);
        Promise.all(promises).then(
          (results) => {
            if (id !== runId) return;
            setAsyncErrors(
              results.filter((e): e is ValidationError => e !== null),
            );
            setAsyncPending(false);
          },
          () => {
            if (id !== runId) return;
            setAsyncPending(false);
          },
        );
      },
    );
  }

  const errors = createMemo(() => {
    if (disabled()) return [];
    const sync = syncErrors();
    const asyncList = asyncErrors();
    return asyncList.length === 0 ? sync : [...sync, ...asyncList];
  });

  const firstError = createMemo(() => errors().at(0)?.message ?? null);
  const valid = createMemo(() => errors().length === 0 && !asyncPending());
  const invalid = createMemo(() => touched() && errors().length > 0);

  const state: FieldState<T> = {
    value,
    set: (next) =>
      setValue((prev) =>
        typeof next === "function" ? (next as SetterFn<T>)(prev) : next,
      ),
    touched,
    dirty,
    disabled,
    pending: asyncPending,
    errors,
    firstError,
    valid,
    invalid,
    markTouched: () => setTouched(true),
    setDisabled,
    reset: (next?: T) => {
      if (next !== undefined) setBaseline(() => next);
      setValue(() => baseline());
      setTouched(false);
    },
  };

  return () => state;
}

interface InternalNodeControls {
  markAllTouched: () => void;
  reset: (next?: unknown) => void;
}

interface ArrayEntry<Item> {
  tree: FieldTree<Item>;
  groupState: GroupState<Item>;
  controls: InternalNodeControls;
  dispose: () => void;
}

function createArrayNode<Item>(
  initialItems: Item[],
  pathNode: ArrayPath<Item>,
  valueOf: <V>(path: FieldPath<V>) => V,
  pathMap: WeakMap<FieldPath<any>, Accessor<any>>,
): {
  tree: () => ArrayState<Item>;
  groupState: GroupState<Item[]>;
  controls: InternalNodeControls;
} {
  function spawnItem(itemValue: Item): ArrayEntry<Item> {
    return createRoot((dispose) => {
      const itemPath = buildPathTree(itemValue);
      for (const runSchema of pathNode.__itemSchemas) {
        runSchema(itemPath);
      }
      const built = buildNodeTree(
        itemValue,
        itemPath as FieldPath<Item>,
        valueOf,
        pathMap,
      );
      return { ...built, dispose };
    });
  }

  let baseline = [...initialItems];
  const [entries, setEntries] = createSignal<ArrayEntry<Item>[]>(
    initialItems.map(spawnItem),
  );
  const [selfTouched, setSelfTouched] = createSignal(false);
  const [structureDirty, setStructureDirty] = createSignal(false);
  const [asyncErrors, setAsyncErrors] = createSignal<ValidationError[]>([]);
  const [asyncPending, setAsyncPending] = createSignal(false);

  const nodes = createMemo(() => entries().map((e) => e.tree));
  const value = createMemo(() => entries().map((e) => e.groupState.value()));

  const syncErrors = createMemo(() => {
    const current = value();
    const ctx: ValidationContext<Item[]> = { value: current, valueOf };
    const list: ValidationError[] = [];
    for (const rule of pathNode.__validators) {
      const err = rule(ctx);
      if (err) list.push(err);
    }
    return list;
  });

  if (pathNode.__asyncValidators.length > 0) {
    let runId = 0;
    createEffect(
      () => {
        const current = value();
        const ctx: ValidationContext<Item[]> = { value: current, valueOf };
        return pathNode.__asyncValidators.map((rule) => rule(ctx));
      },
      (promises) => {
        const id = ++runId;
        setAsyncPending(true);
        Promise.all(promises).then(
          (results) => {
            if (id !== runId) return;
            setAsyncErrors(
              results.filter((e): e is ValidationError => e !== null),
            );
            setAsyncPending(false);
          },
          () => {
            if (id !== runId) return;
            setAsyncPending(false);
          },
        );
      },
    );
  }

  const errors = createMemo(() => {
    const sync = syncErrors();
    const asyncList = asyncErrors();
    return asyncList.length === 0 ? sync : [...sync, ...asyncList];
  });

  const firstError = createMemo(() => errors().at(0)?.message ?? null);
  const touched = createMemo(
    () =>
      selfTouched() || entries().some((e) => e.groupState.touched()),
  );
  const dirty = createMemo(
    () =>
      structureDirty() || entries().some((e) => e.groupState.dirty()),
  );
  const pending = createMemo(
    () =>
      asyncPending() || entries().some((e) => e.groupState.pending()),
  );
  const valid = createMemo(
    () =>
      errors().length === 0 &&
      !asyncPending() &&
      entries().every((e) => e.groupState.valid()),
  );
  const invalid = createMemo(
    () =>
      (touched() && errors().length > 0) ||
      entries().some((e) => e.groupState.invalid()),
  );

  function replaceAll(nextItems: Item[], isReset: boolean): void {
    const prev = entries();
    for (const entry of prev) entry.dispose();
    setEntries(nextItems.map(spawnItem));
    if (isReset) {
      setSelfTouched(false);
      setStructureDirty(false);
    } else {
      setStructureDirty(true);
    }
  }

  const arrayState: ArrayState<Item> = {
    value,
    valid,
    invalid,
    dirty,
    touched,
    pending,
    errors,
    firstError,
    nodes,
    push: (item: Item) => {
      setEntries((prev) => [...prev, spawnItem(item)]);
      setStructureDirty(true);
    },
    insertAt: (index: number, item: Item) => {
      setEntries((prev) => {
        const next = [...prev];
        next.splice(index, 0, spawnItem(item));
        return next;
      });
      setStructureDirty(true);
    },
    removeAt: (index: number) => {
      const current = entries();
      if (index < 0 || index >= current.length) return;
      current[index].dispose();
      setEntries((prev) => prev.filter((_, i) => i !== index));
      setStructureDirty(true);
    },
    move: (from: number, to: number) => {
      setEntries((prev) => {
        if (
          from < 0 ||
          from >= prev.length ||
          to < 0 ||
          to >= prev.length ||
          from === to
        ) {
          return prev;
        }
        const next = [...prev];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next;
      });
      setStructureDirty(true);
    },
    set: (next: Item[]) => replaceAll(next, false),
    markTouched: () => setSelfTouched(true),
    reset: (next?: Item[]) => {
      if (next !== undefined) baseline = [...next];
      replaceAll(baseline, true);
    },
  };

  pathMap.set(pathNode, arrayState.value);

  return {
    tree: () => arrayState,
    groupState: {
      value,
      valid,
      invalid,
      dirty,
      touched,
      pending,
    },
    controls: {
      markAllTouched: () => {
        setSelfTouched(true);
        for (const entry of entries()) entry.controls.markAllTouched();
      },
      reset: (next?: unknown) => {
        arrayState.reset(Array.isArray(next) ? (next as Item[]) : undefined);
      },
    },
  };
}

function buildPathTree<T>(model: T): SchemaPath<T> {
  if (Array.isArray(model)) {
    return {
      __validators: [],
      __asyncValidators: [],
      __itemSchemas: [],
    } as unknown as SchemaPath<T>;
  }

  const path: Record<string, unknown> = {
    __validators: [],
    __asyncValidators: [],
  };
  if (isPlainObject(model)) {
    for (const key of Object.keys(model)) {
      path[key] = buildPathTree(model[key]);
    }
  }
  return path as SchemaPath<T>;
}

function buildNodeTree<T>(
  model: T,
  pathNode: FieldPath<T>,
  valueOf: <V>(path: FieldPath<V>) => V,
  pathMap: WeakMap<FieldPath<any>, Accessor<any>>,
): {
  tree: FieldTree<T>;
  groupState: GroupState<T>;
  controls: InternalNodeControls;
} {
  if (Array.isArray(model)) {
    const built = createArrayNode(
      model,
      pathNode as unknown as ArrayPath<unknown>,
      valueOf,
      pathMap,
    );
    return built as unknown as {
      tree: FieldTree<T>;
      groupState: GroupState<T>;
      controls: InternalNodeControls;
    };
  }

  if (!isPlainObject(model)) {
    const fieldNode = createFieldNode(
      model,
      pathNode.__validators,
      pathNode.__asyncValidators,
      valueOf,
    );
    const state = fieldNode();
    pathMap.set(pathNode, state.value);

    const groupState: GroupState<T> = {
      value: state.value,
      valid: state.valid,
      invalid: state.invalid,
      dirty: state.dirty,
      touched: state.touched,
      pending: state.pending,
    };

    return {
      tree: fieldNode as FieldTree<T>,
      groupState,
      controls: {
        markAllTouched: state.markTouched,
        reset: (next?: unknown) => state.reset(next as T | undefined),
      },
    };
  }

  const keys = Object.keys(model);
  const childTrees: Record<string, unknown> = {};
  const childStates: Record<string, GroupState<unknown>> = {};
  const childControls: Record<string, InternalNodeControls> = {};
  const pathRecord = pathNode as unknown as Record<string, FieldPath<unknown>>;

  for (const key of keys) {
    const built = buildNodeTree(
      model[key],
      pathRecord[key],
      valueOf,
      pathMap,
    );
    childTrees[key] = built.tree;
    childStates[key] = built.groupState;
    childControls[key] = built.controls;
  }

  const value = createMemo<T>(() => {
    const out: Record<string, unknown> = {};
    for (const key of keys) {
      out[key] = childStates[key].value();
    }
    return out as T;
  });

  const valid = createMemo(() => keys.every((k) => childStates[k].valid()));
  const invalid = createMemo(() => keys.some((k) => childStates[k].invalid()));
  const dirty = createMemo(() => keys.some((k) => childStates[k].dirty()));
  const touched = createMemo(() => keys.some((k) => childStates[k].touched()));
  const pending = createMemo(() => keys.some((k) => childStates[k].pending()));

  const groupState: GroupState<T> = {
    value,
    valid,
    invalid,
    dirty,
    touched,
    pending,
  };

  pathMap.set(pathNode, groupState.value);

  const groupFn = (() => groupState) as unknown as FieldTree<T>;
  Object.assign(groupFn as object, childTrees);

  return {
    tree: groupFn,
    groupState,
    controls: {
      markAllTouched: () => {
        for (const key of keys) childControls[key].markAllTouched();
      },
      reset: (next?: unknown) => {
        const nextObj = isPlainObject(next) ? next : undefined;
        for (const key of keys) {
          childControls[key].reset(
            nextObj && key in nextObj ? nextObj[key] : undefined,
          );
        }
      },
    },
  };
}

export function createForm<T extends Record<string, unknown>>(
  initialModel: T,
  schema?: (path: SchemaPath<T>) => void,
): FormTree<T> {
  const paths = buildPathTree(initialModel);
  schema?.(paths);

  const pathMap = new WeakMap<FieldPath<any>, Accessor<any>>();
  const valueOf = <V>(targetPath: FieldPath<V>): V => {
    const getter = pathMap.get(targetPath);
    if (!getter) {
      throw new Error("Unknown field path passed to valueOf()");
    }
    return getter() as V;
  };

  const built = buildNodeTree(
    initialModel,
    paths as FieldPath<T>,
    valueOf,
    pathMap,
  );

  const [submitting, setSubmitting] = createSignal(false);
  const rootInvalid = createMemo(() => !built.groupState.valid());
  const rootState: RootFormState<T> = {
    value: built.groupState.value,
    valid: built.groupState.valid,
    invalid: rootInvalid,
    dirty: built.groupState.dirty,
    touched: built.groupState.touched,
    pending: built.groupState.pending,
    submitting,
  };

  function markAllTouched(): void {
    built.controls.markAllTouched();
  }

  function reset(next?: DeepPartial<T>): void {
    built.controls.reset(next);
  }

  function submit(onValid: (values: T) => void | Promise<void>) {
    return async (event?: SubmitEvent): Promise<void> => {
      event?.preventDefault();
      markAllTouched();
      if (
        !rootState.valid() ||
        rootState.pending() ||
        submitting()
      ) {
        return;
      }

      try {
        setSubmitting(true);
        await onValid(rootState.value());
      } finally {
        setSubmitting(false);
      }
    };
  }

  const rootFn = (() => rootState) as FormTree<T>;
  Object.assign(rootFn, built.tree, { submit, reset, markAllTouched });
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
