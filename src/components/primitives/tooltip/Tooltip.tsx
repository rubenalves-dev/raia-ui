import { ParentProps } from "solid-js";
import { TooltipProps } from "./Tooltip.types";
import { createTooltip } from "../../../primitives/createTooltip";

export function Tooltip(props: ParentProps<TooltipProps>) {
  let trigger!: HTMLSpanElement;

  createTooltip(() => trigger, () => ({
    content: props.content,
    placement: props.placement,
    delay: props.delay,
    offset: props.offset,
    disabled: props.disabled,
  }));

  return (
    <span ref={trigger} class={["v-tooltip-trigger", props.class]}>
      {props.children}
    </span>
  );
}
