import { Match, merge, Switch } from "solid-js";
import { SPINNER_SIZES, SpinnerProps } from "./Spinner.types";
import "./Spinner.scss";

const defaults: SpinnerProps = {
  size: "md",
  variant: "blocks",
};

export function Spinner(props: SpinnerProps) {
  const merged = merge(defaults, props);
  const cssSize = () => {
    const s = merged.size;
    if (!s) return s;
    if (typeof s === "number") return `${s}px`;
    return s in SPINNER_SIZES
      ? `${SPINNER_SIZES[s as keyof typeof SPINNER_SIZES]}px`
      : s;
  };
  const classes = () => ["v-spinner", `v-spinner--${merged.variant}`];

  return (
    <span
      class={classes()}
      role={merged.label ? "status" : undefined}
      aria-label={merged.label}
      aria-hidden={merged.label ? undefined : "true"}
      style={{ "--spinner-size": cssSize() }}
    >
      <Switch>
        <Match when={merged.variant === "blocks"}>
          <span class="v-spinner__block" />
          <span class="v-spinner__block" />
          <span class="v-spinner__block" />
          <span class="v-spinner__block" />
        </Match>
        <Match when={merged.variant === "bars"}>
          <span class="v-spinner__bar" />
          <span class="v-spinner__bar" />
          <span class="v-spinner__bar" />
        </Match>
      </Switch>
    </span>
  );
}
