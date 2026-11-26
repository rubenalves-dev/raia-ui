import { Accessor, createEffect, createUniqueId, onCleanup } from "solid-js";
import { createDisclosure } from "./createDisclosure";
import { createPosition, Placement } from "./createPosition";

export interface TooltipOpts {
  content: string;
  placement?: Placement;
  delay?: number;
  offset?: number;
  disabled?: boolean;
}

export function createTooltip(
  target: Accessor<HTMLElement | undefined>,
  input: string | TooltipOpts,
) {
  const opts: TooltipOpts =
    typeof input === "object" && input !== null && "content" in input
      ? input
      : { content: input };
  const delay = opts.delay ?? 200;
  const tipId = `v-tooltip-${createUniqueId()}`;

  const disclosure = createDisclosure();
  const pos = createPosition({
    placement: opts.placement ?? "top",
    offset: opts.offset ?? 6,
    open: disclosure.isOpen,
  });

  const resolvedContent = () => opts.content;
  const isDisabled = () => opts.disabled ?? false;

  let tipEl: HTMLDivElement | null = null;
  let showTimer: ReturnType<typeof setTimeout> | null = null;

  function teardownTip(el?: HTMLElement): void {
    if (tipEl) {
      if (
        typeof tipEl.hidePopover === "function" &&
        tipEl.matches(":popover-open")
      ) {
        tipEl.hidePopover();
      }
      tipEl.remove();
      tipEl = null;
      pos.setFloating(undefined);
    }
    el?.removeAttribute("aria-describedby");
  }

  function hide(): void {
    if (showTimer) {
      clearTimeout(showTimer);
      showTimer = null;
    }
    disclosure.close();
  }

  createEffect(
    () => ({
      open: disclosure.isOpen(),
      el: target(),
      text: resolvedContent(),
    }),
    ({ open, el, text }) => {
      if (!open || !el || !text || isDisabled()) {
        teardownTip(el);
        return;
      }

      if (!tipEl) {
        const tip = document.createElement("div");
        tip.id = tipId;
        tip.role = "tooltip";
        tip.className = "v-tooltip";
        if ("popover" in tip) tip.popover = "manual";

        document.body.appendChild(tip);
        if (typeof tip.showPopover === "function") tip.showPopover();

        tipEl = tip;
        pos.setFloating(tip);
        el.setAttribute("aria-describedby", tipId);
      }

      tipEl.textContent = text;
      pos.update();
    },
  );

  createEffect(
    () => ({ x: pos.x(), y: pos.y(), placement: pos.resolvedPlacement() }),
    ({ x, y, placement }) => {
      if (!tipEl) return;
      tipEl.style.left = `${x}px`;
      tipEl.style.top = `${y}px`;
      tipEl.dataset.placement = placement;
    },
  );

  createEffect(
    () => target(),
    (el) => {
      if (!el) return;

      const scheduleShow = () => {
        if (isDisabled() || !resolvedContent()) return;
        if (showTimer) clearTimeout(showTimer);
        showTimer = setTimeout(disclosure.open, delay);
      };

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") hide();
      };

      el.addEventListener("pointerenter", scheduleShow);
      el.addEventListener("focusin", scheduleShow);
      el.addEventListener("pointerleave", hide);
      el.addEventListener("focusout", hide);
      el.addEventListener("keydown", onKeyDown);

      onCleanup(() => {
        hide();
        teardownTip(el);
        el.removeEventListener("pointerenter", scheduleShow);
        el.removeEventListener("focusin", scheduleShow);
        el.removeEventListener("pointerleave", hide);
        el.removeEventListener("focusout", hide);
        el.removeEventListener("keydown", onKeyDown);
      });
    },
  );
}
