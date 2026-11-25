import { children, merge, ParentProps, Show } from "solid-js";
import { DividerProps } from "./Divider.types";
import "./Divider.scss";

const defaults: Partial<DividerProps> = {
  orientation: "horizontal",
} as const;

export function Divider(props: ParentProps<DividerProps>) {
  const merged = merge(defaults, props);
  const resolved = children(() => merged.children);
  const hasLabel = () => !!resolved() && merged.orientation === "horizontal";
  const classes = () => [
    "v-divider",
    `v-divider--${merged.orientation}`,
    {
      "v-divider--dashed": merged.dashed,
      "v-divider--with-label": hasLabel(),
    },
  ];

  return (
    <div
      class={classes()}
      role={merged.decorative ? "none" : "separator"}
      aria-orientation={merged.decorative ? undefined : merged.orientation}
    >
      <Show when={hasLabel()}>
        <span class="v-divider__label">{resolved()}</span>
      </Show>
    </div>
  );
}
