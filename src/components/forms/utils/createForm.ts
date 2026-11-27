import { Accessor, createMemo, createSignal } from "solid-js";
import { buildNodeTree, buildPathTree } from "./nodes";
import type {
  DeepPartial,
  FieldPath,
  FormTree,
  RootFormState,
  SchemaPath,
} from "./types";

export * from "./types";
export * from "./useField";
export * from "./validators";

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
      if (!rootState.valid() || rootState.pending() || submitting()) {
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
  for (const [key, val] of Object.entries({
    ...built.tree,
    submit,
    reset,
    markAllTouched,
  })) {
    Object.defineProperty(rootFn, key, {
      value: val,
      configurable: true,
      writable: true,
      enumerable: true,
    });
  }

  return rootFn;
}
