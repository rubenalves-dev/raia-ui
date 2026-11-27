import { merge } from "solid-js";
import { InputProps } from "./Input.types";
import { omitFieldProps, useField } from "../utils/useField";
import "./Input.scss";

const defaults: Partial<InputProps> = {
  type: "text",
  disabled: false,
  invalid: false,
};

export function Input(props: InputProps) {
  const merged = merge(defaults, props);

  const field = useField(merged);
  const rest = omitFieldProps(merged);

  const classes = () => [
    "v-input",
    {
      "v-input--invalid": field.invalid(),
      "v-input--disabled": field.disabled(),
    },
  ];

  function onInput(event: InputEvent) {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement) || !target) return;
    field.set(
      rest.type === "number" && target.value !== ""
        ? Number(target.value)
        : target.value,
    );
  }

  return (
    <input
      id={field.id()}
      class={classes()}
      type={rest.type}
      value={field.value()}
      placeholder={rest.placeholder}
      autocomplete={rest.autocomplete}
      disabled={field.disabled() || undefined}
      aria-invalid={field.invalid() ? "true" : undefined}
      onInput={onInput}
      onBlur={field.onBlur}
    />
  );
}
