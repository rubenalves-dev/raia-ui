import {
  Accessor,
  createEffect,
  createMemo,
  createRoot,
  createSignal,
} from "solid-js";
import type {
  ArrayPath,
  ArrayState,
  AsyncFieldValidator,
  FieldNode,
  FieldPath,
  FieldState,
  FieldTree,
  FieldValidator,
  GroupState,
  InternalNodeControls,
  SchemaPath,
  SetterFn,
  ValidationContext,
  ValidationError,
} from "./types";

export function isPlainObject(val: unknown): val is Record<string, unknown> {
  if (typeof val !== "object" || val === null || Array.isArray(val)) {
    return false;
  }
  const proto = Object.getPrototypeOf(val);
  return proto === Object.prototype || proto === null;
}

function createValidationRunner<T>(
  value: Accessor<T>,
  validators: FieldValidator<T>[],
  asyncValidators: AsyncFieldValidator<T>[],
  valueOf: <V>(path: FieldPath<V>) => V,
  disabled?: Accessor<boolean>,
): {
  errors: Accessor<ValidationError[]>;
  pending: Accessor<boolean>;
} {
  const [asyncErrors, setAsyncErrors] = createSignal<ValidationError[]>([]);
  const [asyncPending, setAsyncPending] = createSignal(false);

  const syncErrors = createMemo(() => {
    if (disabled?.()) return [];
    const ctx: ValidationContext<T> = { value: value(), valueOf };
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
        if (disabled?.()) return null;
        const ctx: ValidationContext<T> = { value: value(), valueOf };
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
    if (disabled?.()) return [];
    const sync = syncErrors();
    const asyncList = asyncErrors();
    return asyncList.length === 0 ? sync : [...sync, ...asyncList];
  });

  return { errors, pending: asyncPending };
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

  const dirty = createMemo(() => !Object.is(value(), baseline()));
  const { errors, pending } = createValidationRunner(
    value,
    validators,
    asyncValidators,
    valueOf,
    disabled,
  );

  const firstError = createMemo(() => errors().at(0)?.message ?? null);
  const valid = createMemo(() => errors().length === 0 && !pending());
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
    pending,
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

  const nodes = createMemo(() => entries().map((e) => e.tree));
  const value = createMemo(() => entries().map((e) => e.groupState.value()));
  const { errors, pending: asyncPending } = createValidationRunner(
    value,
    pathNode.__validators,
    pathNode.__asyncValidators,
    valueOf,
  );

  const firstError = createMemo(() => errors().at(0)?.message ?? null);
  const touched = createMemo(
    () => selfTouched() || entries().some((e) => e.groupState.touched()),
  );
  const dirty = createMemo(
    () => structureDirty() || entries().some((e) => e.groupState.dirty()),
  );
  const pending = createMemo(
    () => asyncPending() || entries().some((e) => e.groupState.pending()),
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
    for (const entry of entries()) entry.dispose();
    setEntries(nextItems.map(spawnItem));
    setSelfTouched(!isReset && selfTouched());
    setStructureDirty(!isReset);
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
    groupState: { value, valid, invalid, dirty, touched, pending },
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

export function buildPathTree<T>(model: T): SchemaPath<T> {
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

export function buildNodeTree<T>(
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
    return createArrayNode(
      model,
      pathNode as unknown as ArrayPath<unknown>,
      valueOf,
      pathMap,
    ) as unknown as {
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

    return {
      tree: fieldNode as FieldTree<T>,
      groupState: {
        value: state.value,
        valid: state.valid,
        invalid: state.invalid,
        dirty: state.dirty,
        touched: state.touched,
        pending: state.pending,
      },
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
