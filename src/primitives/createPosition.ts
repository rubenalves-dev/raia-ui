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

export function createPosition(
  input: CreatePositionOpts | Accessor<CreatePositionOpts> = {},
): PositionResult {
  const getOpts = (): CreatePositionOpts =>
    typeof input === "function" ? input() : input;

  const placement = () => getOpts().placement ?? "bottom-start";
  const offset = () => getOpts().offset ?? 6;
  const padding = () => getOpts().padding ?? 8;

  const [anchor, setAnchor] = createSignal<HTMLElement | undefined>();
  const [floating, setFloating] = createSignal<HTMLElement | undefined>();
  const [x, setX] = createSignal(0);
  const [y, setY] = createSignal(0);
  const [resolvedPlacement, setResolvedPlacement] =
    createSignal<Placement>("bottom-start");

  function computeCoords(
    aRect: DOMRect,
    fRect: DOMRect,
    target: Placement,
  ): { x: number; y: number } {
    const gap = offset();
    switch (target) {
      case "top":
        return {
          x: aRect.left + (aRect.width - fRect.width) / 2,
          y: aRect.top - fRect.height - gap,
        };
      case "top-start":
        return {
          x: aRect.left,
          y: aRect.top - fRect.height - gap,
        };
      case "top-end":
        return {
          x: aRect.left - fRect.width,
          y: aRect.top - fRect.height - gap,
        };
      case "bottom":
        return {
          x: aRect.left + (aRect.width - fRect.width) / 2,
          y: aRect.bottom + gap,
        };
      case "bottom-start":
        return {
          x: aRect.left,
          y: aRect.bottom + gap,
        };
      case "bottom-end":
        return {
          x: aRect.left - fRect.width,
          y: aRect.bottom + gap,
        };
      case "left":
        return {
          x: aRect.left - fRect.width - gap,
          y: aRect.top + (aRect.height - fRect.height) / 2,
        };
      case "right":
        return {
          x: aRect.right - gap,
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
    const pad = padding();

    let active = placement();
    let coords = computeCoords(aRect, fRect, active);

    if (active.startsWith("bottom") && coords.y + fRect.height > vh - pad) {
      const flipped = active.replace("bottom", "top") as Placement;
      const flippedCoords = computeCoords(aRect, fRect, flipped);
      if (flippedCoords.y >= pad) {
        active = flipped;
        coords = flippedCoords;
      }
    } else if (active.startsWith("top") && coords.y < pad) {
      const flipped = active.replace("top", "bottom") as Placement;
      const flippedCoords = computeCoords(aRect, fRect, flipped);
      if (flippedCoords.y + fRect.height <= vh - pad) {
        active = flipped;
        coords = flippedCoords;
      }
    }

    const clampedX = Math.max(
      pad,
      Math.min(coords.x, vw - fRect.width - pad),
    );
    const clampedY = Math.max(
      pad,
      Math.min(coords.y, vh - fRect.height - pad),
    );

    setResolvedPlacement(active);
    setX(Math.round(clampedX));
    setY(Math.round(clampedY));
  }

  createEffect(
    () => {
      const o = getOpts();
      return {
        isOpen: o.open ? o.open() : true,
        aEl: anchor(),
        fEl: floating(),
        placement: o.placement ?? "bottom-start",
        offset: o.offset ?? 6,
        padding: o.padding ?? 8,
      };
    },
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
