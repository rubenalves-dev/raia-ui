import { createMemo, merge } from "solid-js";
import { ICON_SIZES, IconProps, ICONS } from "./Icon.types";
import "./Icon.scss";

const defaults: Partial<IconProps> = {
  size: "md",
};

export function Icon(props: IconProps) {
  const merged = merge(defaults, props);
  const cssSize = () => {
    const s = merged.size;
    if (!s) return;
    if (typeof s === "number") return `${s}px`;
    return s in ICON_SIZES
      ? `${ICON_SIZES[s as keyof typeof ICON_SIZES]}px`
      : s;
  };

  const classes = () => ["v-icon", merged.class];

  const markup = createMemo(() => ICONS[merged.name] || "");

  return (
    <span
      class={classes()}
      role={merged.label ? "img" : undefined}
      aria-label={merged.label || undefined}
      aria-hidden={merged.label ? undefined : "true"}
      style={{ "--icon-size": cssSize() }}
      // oxlint-disable-next-line solid/no-innerhtml
      innerHTML={markup()}
    />
  );
}
