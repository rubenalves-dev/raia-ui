import { merge, ParentProps } from "solid-js";
import { BadgeProps } from "./Badge.types";
import "./Badge.scss";

const defaults: Partial<BadgeProps> = {
  variant: "default",
} as const;

export function Badge(props: ParentProps<BadgeProps>) {
  const merged = merge(defaults, props);
  const classes = () => ["v-badge", `v-badge--${merged.variant}`];

  return <span class={classes()}>{merged.children}</span>;
}
