import { Accessor, createEffect, onCleanup } from "solid-js";

export type ClickOutsideTarget =
  Accessor<HTMLElement | undefined> | Accessor<(HTMLElement | undefined)[]>;

export interface CreateClickOutsideOpts {
  enabled?: Accessor<boolean>;
  event?: "pointerdown" | "mousedown" | "click";
}

export function createClickOutside(
  target: ClickOutsideTarget,
  handler: (event: MouseEvent | PointerEvent) => void,
  options: CreateClickOutsideOpts = {},
) {
  const eventName = options.event ?? "pointerdown";

  createEffect(
    () => (options.enabled ? options.enabled() : true),
    (active) => {
      if (!active) return;

      const onEvent = (event: MouseEvent | PointerEvent) => {
        const path = event.composedPath();
        const raw = target();
        const elements = Array.isArray(raw) ? raw : [raw];
        const isInside = elements.some((el) => el && path.includes(el));
        if (!isInside) {
          handler(event);
        }
      };

      document.addEventListener(eventName, onEvent, true);
      onCleanup(() => document.removeEventListener(eventName, onEvent, true));
    },
  );
}
