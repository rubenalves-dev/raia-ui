import { createEffect, createSignal, merge } from "solid-js";
import { TextareaProps } from "./Textarea.types";
import { useField } from "../utils";
import "./Textarea.scss";

const defaults: Partial<TextareaProps> = {
  rows: 3,
  resize: "vertical",
};

export function Textarea(props: TextareaProps) {
  const merged = merge(defaults, props);
  const field = useField(merged);

  const [textareaRef, setTextareaRef] = createSignal<
    HTMLTextAreaElement | undefined
  >();

  createEffect(
    () => ({ el: textareaRef(), val: field.value() }),
    ({ el }) => {
      if (!el?.value || !props.autoResize) return;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    },
  );

  function onInput(event: Event) {
    const target = event.currentTarget;
    if (!(target instanceof HTMLTextAreaElement)) return;
    field.set(target.value);
  }

  const classes = () => [
    "v-textarea",
    {
      "v-textarea--invalid": field.invalid(),
      "v-textarea--disabled": field.disabled(),
      "v-textarea--auto-resize": merged.autoResize,
    },
  ];

  return (
    <textarea
      id={field.id()}
      ref={setTextareaRef}
      class={classes()}
      value={field.value()}
      rows={merged.rows}
      maxlength={merged.maxLenght}
      placeholder={merged.placeholder}
      disabled={field.disabled()}
      aria-invalid={field.invalid() ? "true" : undefined}
      style={{ resize: merged.autoResize ? "none" : merged.resize }}

      onInput={onInput}
      onBlur={field.onBlur}
    />
  );
}
