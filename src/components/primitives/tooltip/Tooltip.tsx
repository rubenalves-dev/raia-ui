import { createSignal, ParentProps } from "solid-js";
import { TooltipProps } from "./Tooltip.types";
import { createTooltip } from "../../../primitives/createTooltip";
import "./Tooltip.scss";

export function Tooltip(props: ParentProps<TooltipProps>) {
  const [trigger, setTrigger] = createSignal<HTMLSpanElement | undefined>();

  createTooltip(
    trigger,
    () => ({
      content: props.content,
      placement: props.placement,
      delay: props.delay,
      offset: props.offset,
      disabled: props.disabled,
    }),
  );

  return (
    <span ref={setTrigger} class={["v-tooltip-trigger", props.class]}>
      {props.children}
    </span>
  );
}
