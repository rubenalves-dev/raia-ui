import { merge, Show } from "solid-js";
import { CheckboxProps } from "./Checkbox.types";
import { omitFieldProps, useField } from "../utils";
import { Icon } from "../../primitives";
import "./Checkbox.scss";

const defaults: Partial<CheckboxProps> = {
  disabled: false,
  invalid: false,
  required: false,
  indeterminate: false,
};

export function Checkbox(props: CheckboxProps) {
  const merged = merge(defaults, props);
  const field = useField(merged);
  const rest = omitFieldProps(merged);

  const classes = () => [
    "v-checkbox",
    {
      "v-checkbox--checked": field.value(),
      "v-checkbox--indeterminate": rest.indeterminate && !field.value(),
      "v-checkbox--invalid": field.invalid(),
    },
  ];

  function toggle(): void {
    if (!field.disabled()) {
      field.set(!field.value());
    }
  }

  function onBlur(): void {
    field.onBlur();
    rest.onTouch?.();
  }

  return (
    <button
      type="button"
      role="checkbox"
      id={field.id()}
      class={classes()}
      aria-required={rest.required ? "true" : undefined}
      aria-checked={
        rest.indeterminate && !field.value()
          ? "mixed"
          : field.value()
            ? "true"
            : "false"
      }
      disabled={field.disabled()}

      onClick={toggle}
      onBlur={onBlur}
    >
      <span class="v-checkbox__box">
        <Show when={rest.indeterminate && !field.value()}>
          <Icon name="minus" size="xs" class="v-checkbox__icon" />
        </Show>
        <Show when={field.value()}>
          <Icon name="check" size="xs" class="v-checkbox__icon" />
        </Show>
      </span>
    </button>
  );
}
