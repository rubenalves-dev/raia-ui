import { omitFieldProps, useField } from "../utils";
import "./Switch.scss";
import { SwitchProps } from "./Switch.types";

export function Switch(props: SwitchProps) {
  const field = useField(props);
  const rest = omitFieldProps(props);

  const classes = () => [
    "v-switch",
    {
      "v-switch--checked": field.value(),
      "v-switch--disabled": field.disabled(),
      "v-switch--invalid": field.invalid(),
    },
  ];

  function toggle(): void {
    if (!field.disabled()) {
      field.set(!field.value());
    }
  }

  return (
    <button
      type="button"
      role="switch"
      class={classes()}
      aria-checked={field.value() ? "true" : "false"}
      aria-required={rest.required ? "true" : "false"}

      onClick={toggle}
      onBlur={field.onBlur}
    >
      <span class="v-switch__track">
        <span class="v-switch__thumb" />
      </span>
    </button>
  );
}
