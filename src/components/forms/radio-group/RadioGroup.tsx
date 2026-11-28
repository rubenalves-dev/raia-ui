import { createMemo, createSignal, For, merge, Show } from "solid-js";
import "./RadioGroup.scss";
import { RadioGroupProps, RadioOption } from "./RadioGroup.types";
import { useField } from "../utils";

const defaults: Partial<RadioGroupProps> = {
  orientation: "vertical",
  required: false,
  disabled: false,
  invalid: false,
};

export function RadioGroup(props: RadioGroupProps) {
  const merged = merge(defaults, props);
  const field = useField(merged);

  const [rootRef, setRootRef] = createSignal<HTMLElement | null>(null);
  const [itemsRef, setItemsRef] = createSignal<(HTMLButtonElement | null)[]>(
    [],
  );

  function addToItemsRef(el: Element, index: number) {
    setItemsRef((prev) => {
      const arr = prev;
      arr[index] = el instanceof HTMLButtonElement ? el : null;
      return arr;
    });
  }

  const activeIndex = createMemo(() => {
    const selected = merged.options.findIndex(
      (o) => o.value === field.value() && !o.disabled,
    );
    if (selected >= 0) return selected;
    return props.options.findIndex((o) => !o.disabled);
  });

  function selectOption(option: RadioOption, index: number): void {
    if (field.disabled() || option.disabled) return;
    field.set(option.value);
    itemsRef()[index]?.focus();
  }

  function onKeydown(event: KeyboardEvent, currentIndex: number): void {
    let step: 1 | -1 | null = null;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") step = 1;
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") step = -1;
    if (!step) return;

    event.preventDefault();
    if (field.disabled()) return;

    let next = currentIndex + step;
    while (next >= 0 && next < props.options.length) {
      const candidate = props.options[next];
      if (candidate && !candidate.disabled) {
        selectOption(candidate, next);
        return;
      }
      next += step;
    }
  }

  function onFocusOut(event: FocusEvent): void {
    const related = event.relatedTarget;
    if (
      !related ||
      !(related instanceof Node) ||
      !rootRef()?.contains(related)
    ) {
      field.onBlur();
    }
  }

  const classes = () => [
    "v-radio-group",
    `v-radio-group--${merged.orientation}`,
    {
      "v-radio-group--disabled": field.disabled(),
      "v-radio-group--invalid": field.invalid(),
    },
  ];

  return (
    <div
      id={field.id()}
      ref={setRootRef}
      role="radiogroup"
      class={classes()}
      aria-required={merged.required ? "true" : undefined}
      aria-invalid={field.invalid() ? "true" : undefined}
      aria-disabled={field.disabled() ? "true" : undefined}

      onFocusOut={onFocusOut}
    >
      <For each={merged.options}>
        {(option, index) => (
          <div
            class={[
              "v-radio-group__item",
              {
                "v-radio-group__item--checked": option.value === field.value(),
                "v-radio-group__item--disabled":
                  field.disabled() || option.disabled,
              },
            ]}
            onClick={() => selectOption(option, index())}
          >
            <button
              ref={(el) => addToItemsRef(el, index())}
              type="button"
              role="radio"
              class="v-radio-group__control"
              aria-checked={field.value() === option.value ? "true" : "false"}
              disabled={field.disabled() || option.disabled}
              tabindex={index() === activeIndex() && !field.disabled() ? 0 : -1}

              onKeyDown={(event) => onKeydown(event, index())}
            >
              <span class="v-radio-group__dot" />
            </button>

            <div class="v-radio-group__content">
              <span class="v-radio-group__label">{option.label}</span>
              <Show when={option.description}>
                <span class="v-radio-group__description">
                  {option.description}
                </span>
              </Show>
            </div>
          </div>
        )}
      </For>
    </div>
  );
}
