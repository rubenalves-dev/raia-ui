import { Accessor, createEffect, createSignal, onCleanup } from "solid-js";

export type Placement =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "right";

export interface CreatePositionOpts {
  placement?: Placement;
  offset?: number;
  padding?: number;
  open?: Accessor<boolean>;
}

export interface PositionResult {
  readonly x: Accessor<number>;
  readonly y: Accessor<number>;
  readonly resolvedPlacement: Accessor<Placement>;
  readonly setAnchor: (el: HTMLElement | undefined) => void;
  readonly setFloating: (el: HTMLElement | undefined) => void;
  readonly update: () => void;
}

export function createPosition(opts: CreatePositionOpts = {}): PositionResult {
  const placement = opts.placement ?? "bottom-start";
  const offset = opts.offset ?? 6;
  const padding = opts.padding ?? 8;

  const [anchor, setAnchor] = createSignal<HTMLElement | undefined>();
  const [floating, setFloating] = createSignal<HTMLElement | undefined>();
  const [x, setX] = createSignal(0);
  const [y, setY] = createSignal(0);
  const [resolvedPlacement, setResolvedPlacement] = createSignal(placement);

  function computeCoords(
    aRect: DOMRect,
    fRect: DOMRect,
    target: Placement,
  ): { x: number; y: number } {
    switch (target) {
      case "top":
        return {
          x: aRect.left + (aRect.width - fRect.width) / 2,
          y: aRect.top - fRect.height - offset,
        };
      case "top-start":
        return {
          x: aRect.left,
          y: aRect.top - fRect.height - offset,
        };
      case "top-end":
        return {
          x: aRect.left - fRect.width,
          y: aRect.top - fRect.height - offset,
        };
      case "bottom":
        return {
          x: aRect.left + (aRect.width - fRect.width) / 2,
          y: aRect.bottom + offset,
        };
      case "bottom-start":
        return {
          x: aRect.left,
          y: aRect.bottom + offset,
        };
      case "bottom-end":
        return {
          x: aRect.left - fRect.width,
          y: aRect.bottom + offset,
        };
      case "left":
        return {
          x: aRect.left - fRect.width - offset,
          y: aRect.top + (aRect.height - fRect.height) / 2,
        };
      case "right":
        return {
          x: aRect.right - offset,
          y: aRect.top + (aRect.height - fRect.height) / 2,
        };
    }
  }

  function update(): void {
    const aEl = anchor();
    const fEl = floating();
    if (!aEl || !fEl) return;

    const aRect = aEl.getBoundingClientRect();
    const fRect = fEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let active = placement;
    let coords = computeCoords(aRect, fRect, active);

    if (active.startsWith("bottom") && coords.y + fRect.height > vh - padding) {
      const flipped = active.replace("bottom", "top") as Placement;
      const flippedCoords = computeCoords(aRect, fRect, flipped);
      if (flippedCoords.y >= padding) {
        active = flipped;
        coords = flippedCoords;
      }
    } else if (active.startsWith("top") && coords.y < padding) {
      const flipped = active.replace("top", "bottom") as Placement;
      const flippedCoords = computeCoords(aRect, fRect, flipped);
      if (flippedCoords.y + fRect.height <= vh - padding) {
        active = flipped;
        coords = flippedCoords;
      }
    }

    const clampedX = Math.max(
      padding,
      Math.min(coords.x, vw - fRect.width - padding),
    );
    const clampedY = Math.max(
      padding,
      Math.min(coords.y, vh - fRect.height - padding),
    );

    setResolvedPlacement(active);
    setX(Math.round(clampedX));
    setY(Math.round(clampedY));
  }

  createEffect(
    () => ({
      isOpen: opts.open ? opts.open() : true,
      aEl: anchor(),
      fEl: floating(),
    }),
    ({ isOpen, aEl, fEl }) => {
      if (!isOpen || !aEl || !fEl) return;

      update();

      const ro = new ResizeObserver(update);
      ro.observe(aEl);
      ro.observe(fEl);

      window.addEventListener("scroll", update, true);
      window.addEventListener("resize", update);

      onCleanup(() => {
        ro.disconnect();
        window.removeEventListener("scroll", update, true);
        window.removeEventListener("resize", update);
      });
    },
  );

  return { x, y, resolvedPlacement, setAnchor, setFloating, update };
}
