import { Accessor, createEffect, createSignal, SourceAccessor } from "solid-js";

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
  matchWidth?: Accessor<boolean>;
  hideWhenDetached?: boolean;

  onAnchorHidden?: () => void;
}

export interface PositionResult {
  readonly x: Accessor<number>;
  readonly y: Accessor<number>;
  readonly resolvedPlacement: Accessor<Placement>;
  readonly setAnchor: (el: HTMLElement | undefined) => void;
  readonly setFloating: (el: HTMLElement | undefined) => void;
  readonly anchor: SourceAccessor<HTMLElement | undefined>;
  readonly floating: SourceAccessor<HTMLElement | undefined>;
  readonly update: () => void;
  readonly styles: () => any;
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
  const [hidden, setHidden] = createSignal(false);

  function computeCoords(
    aRect: DOMRect,
    fRect: DOMRect,
    target: Placement,
    matchWidth?: boolean,
  ): { x: number; y: number; minWidth: number | undefined } {
    const gap = offset();
    const effectiveWidth = matchWidth ? aRect.width : fRect.width;
    switch (target) {
      case "top":
        return {
          x: aRect.left + (aRect.width - effectiveWidth) / 2,
          y: aRect.top - fRect.height - gap,
          minWidth: effectiveWidth,
        };
      case "top-start":
        return {
          x: aRect.left,
          y: aRect.top - fRect.height - gap,
          minWidth: effectiveWidth,
        };
      case "top-end":
        return {
          x: aRect.right - effectiveWidth,
          y: aRect.top - fRect.height - gap,
          minWidth: effectiveWidth,
        };
      case "bottom":
        return {
          x: aRect.left + (aRect.width - effectiveWidth) / 2,
          y: aRect.bottom + gap,
          minWidth: effectiveWidth,
        };
      case "bottom-start":
        return {
          x: aRect.left,
          y: aRect.bottom + gap,
          minWidth: effectiveWidth,
        };
      case "bottom-end":
        return {
          x: aRect.right - effectiveWidth,
          y: aRect.bottom + gap,
          minWidth: effectiveWidth,
        };
      case "left":
        return {
          x: aRect.left - fRect.width - gap,
          y: aRect.top + (aRect.height - fRect.height) / 2,
          minWidth: effectiveWidth,
        };
      case "right":
        return {
          x: aRect.right + gap,
          y: aRect.top + (aRect.height - fRect.height) / 2,
          minWidth: effectiveWidth,
        };
    }
  }

  function handleVisibility(outOfView: boolean): void {
    const enabled = getOpts().hideWhenDetached ?? true;
    if (!enabled) {
      setHidden(false);
      return;
    }

    const wasHidden = hidden();
    if (wasHidden === outOfView) return;

    setHidden(outOfView);
    if (outOfView) {
      getOpts().onAnchorHidden?.();
    }
  }

  function update(
    aEl: HTMLElement | undefined = anchor(),
    fEl: HTMLElement | undefined = floating(),
  ): void {
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

    const clampedX = Math.max(pad, Math.min(coords.x, vw - fRect.width - pad));
    const clampedY = Math.max(pad, Math.min(coords.y, vh - fRect.height - pad));

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
      if (!isOpen || !aEl || !fEl) {
        setHidden(false);
        return;
      }

      const sync = () => update(aEl, fEl);
      sync();

      const ro = new ResizeObserver(sync);
      ro.observe(aEl);
      ro.observe(fEl);

      const io = new IntersectionObserver(
        ([entry]) => {
          handleVisibility(!entry.isIntersecting);
        },
        { threshold: 0 },
      );
      io.observe(aEl);

      window.addEventListener("scroll", sync, true);
      window.addEventListener("resize", sync);

      return () => {
        ro.disconnect();
        io.disconnect();
        window.removeEventListener("scroll", sync, true);
        window.removeEventListener("resize", sync);
      };
    },
  );

  function styles(): unknown {
    const isHidden = hidden();
    return {
      position: "fixed" as const,
      top: `${y()}px`,
      left: `${x()}px`,
      zIndex: 60,
      visibility: isHidden ? ("hidden" as const) : ("visible" as const),
      pointerEvents: isHidden ? ("none" as const) : undefined,
    };
  }

  return {
    x,
    y,
    resolvedPlacement,
    setAnchor,
    setFloating,
    update: () => update(),
    anchor,
    floating,
    styles,
  };
}
