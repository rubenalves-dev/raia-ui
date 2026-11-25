import { merge, omit, Show } from "solid-js";
import "./Button.scss";
import { ButtonProps } from "./Button.types";
import { dynamic } from "@solidjs/web";
import { Spinner } from "../spinner/Spinner";

const defaults = {
  as: "button",
  variant: "primary",
  size: "md",
  isLoading: false,
  disabled: false,
  type: "button",
} satisfies Partial<ButtonProps>;

export function Button(props: ButtonProps) {
  const merged = merge(defaults, props);
  const rest = omit(
    props,
    "as",
    "variant",
    "size",
    "isLoading",
    "disabled",
    "type",
    "class",
    "children",
  );

  const isNativeButton = () => merged.as === "button";
  const isDisabled = () => merged.isLoading || merged.disabled;

  const Root = dynamic(() => merged.as);

  const classes = () => [
    "v-btn",
    `v-btn--${merged.variant}`,
    `v-btn--${merged.size}`,
    {
      "v-btn--loading": merged.isLoading,
      "v-btn--disabled": merged.disabled,
    },
    merged.class,
  ];

  return (
    <Root
      {...rest}
      class={classes()}
      type={isNativeButton() ? merged.type : undefined}
      disabled={isNativeButton() ? isDisabled() : undefined}
      aria-disabled={!isNativeButton() && isDisabled() ? "true" : undefined}
      aria-busy={merged.isLoading ? "true" : undefined}
      tabindex={!isNativeButton() && isDisabled() ? -1 : undefined}
    >
      <Show when={merged.isLoading}>
        <span class="v-btn__spinner">
          <Spinner />
        </span>
      </Show>
      <span class="v-btn__content">{merged.children}</span>
    </Root>
  );
}
