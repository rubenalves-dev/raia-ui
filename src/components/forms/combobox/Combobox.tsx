import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  For,
  merge,
  Show,
} from "solid-js";
import { ComboboxOption, ComboboxProps } from "./Combobox.types";
import { omitFieldProps, useField } from "../utils";
import {
  createClickOutside,
  createDisclosure,
  createPosition,
  Icon,
} from "../../..";
import "./Combobox.scss";

const defaults: Partial<ComboboxProps> = {
  placeholder: "Select an option...",
  disabled: false,
  invalid: false,
  clearable: false,
};

export function Combobox<T = unknown>(props: ComboboxProps<T>) {
  const merged = merge(defaults, props);
  const field = useField(merged);
  const rest = omitFieldProps(merged);

  const listboxId = createUniqueId();
  const [inputRef, setInputRef] = createSignal<HTMLInputElement | undefined>();

  const [displayValue, setDisplayValue] = createSignal("");
  const [query, setQuery] = createSignal("");
  const [highlightedIndex, setHighlightedIndex] = createSignal(-1);

  const disclosure = createDisclosure({
    onClose: () => {
      setHighlightedIndex(-1);
      setQuery("");
    },
  });
  const position = createPosition(() => ({
    open: () => disclosure.isOpen(),
    onAnchorHidden: () => disclosure.close(),
  }));
  createClickOutside(
    () => [position.anchor(), position.floating()],
    () => {
      disclosure.close();
    },
    { enabled: disclosure.isOpen },
  );

  const selectedOption = createMemo(() =>
    rest.options.find((o) => o.value === field.value()),
  );

  const filteredOptions = createMemo(() => {
    const q = query().trim();
    if (!q) return rest.options;
    if (rest.filterFn) return rest.options.filter((o) => rest.filterFn!(o, q));
    const lower = q.toLowerCase();
    return rest.options.filter((o) => o.label.toLowerCase().includes(lower));
  });

  createEffect(
    () => [selectedOption(), disclosure.isOpen()],
    ([option, open]) => {
      if (!open) {
        setDisplayValue(option ? option.label : "");
      }
    },
  );

  function getOptionId(listboxId: string, index: number) {
    return `${listboxId}-opt-${index}`;
  }

  function selectOption(option: ComboboxOption<T>) {
    if (option.disabled) return;
    field.set(option.value);
    setDisplayValue(option.label);
    setQuery("");
    rest.onSelect?.(option);
    disclosure.close();
  }

  function clearSelection() {
    field.set(null);
    setDisplayValue("");
    setQuery("");
    rest.onSelect?.(null);
    inputRef()?.focus();
  }

  function onInput(event: InputEvent) {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement)) return;
    const value = target.value;
    setDisplayValue(value);
    setQuery(value);
    if (!disclosure.isOpen()) disclosure.open();
    setHighlightedIndex(filteredOptions().findIndex((o) => !o.disabled));
  }

  function moveHighlight(step: 1 | -1) {
    if (!disclosure.isOpen()) {
      disclosure.open();
      return;
    }
    const len = filteredOptions().length;
    if (len === 0) return;

    let next = highlightedIndex();
    for (let i = 0; i < len; i++) {
      next = (next + step + len) % len;
      if (!filteredOptions()[next]?.disabled) {
        setHighlightedIndex(next);
      }
    }
  }

  function onKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveHighlight(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveHighlight(-1);
        break;
      case "Enter":
        if (disclosure.isOpen() && highlightedIndex() >= 0) {
          event.preventDefault();
          const opt = filteredOptions()[highlightedIndex()];
          if (opt) selectOption(opt);
        }
        break;
      case "Escape":
        if (disclosure.isOpen()) {
          event.preventDefault();
          disclosure.close();
        }
        break;
      case "Tab":
        disclosure.close();
        break;
    }
  }

  const classes = () => [
    "v-combobox",
    {
      "v-combobox--open": disclosure.isOpen(),
      "v-combobox--disabled": field.disabled(),
      "v-combobox--invalid": field.invalid(),
    },
  ];

  return (
    <div ref={position.setAnchor} class={classes()}>
      <div class="v-combobox__control">
        <input
          ref={setInputRef}
          type="text"
          role="combobox"
          class="v-combobox__input"
          autocomplete="off"
          value={displayValue()}
          placeholder={merged.placeholder}
          disabled={merged.disabled}
          aria-expanded={disclosure.isOpen() ? "true" : undefined}
          aria-controls={listboxId}
          aria-activedescendant={
            highlightedIndex() >= 0
              ? getOptionId(listboxId, highlightedIndex())
              : undefined
          }
          onFocus={disclosure.open}
          onInput={onInput}
          onKeyDown={onKeydown}
        />

        <Show
          when={merged.clearable && field.value() !== null && !merged.disabled}
        >
          <button
            type="button"
            class="v-combobox__clear"
            aria-label="Clear selection"
            tabindex="-1"
            onClick={() => clearSelection()}
          >
            <Icon name="x" size="xs" />
          </button>
        </Show>

        <button
          type="button"
          class="v-combobox__trigger"
          tabindex="-1"
          disabled={merged.disabled}
          aria-label="Toggle options"
          onClick={() =>
            disclosure.isOpen() ? disclosure.close() : inputRef()?.focus()
          }
        >
          <Icon name="chevron-down" size="xs" />
        </button>
      </div>

      <Show when={disclosure.isOpen()}>
        <div
          ref={position.setFloating}
          class="v-combobox__popover"
          style={position.styles()}
        >
          <ul id={listboxId} role="listbox" class="v-combobox__listbox">
            <For
              each={filteredOptions()}
              fallback={<li class="v-combobox__empty">No results found</li>}
            >
              {(option, index) => (
                <li
                  id={getOptionId(listboxId, index())}
                  role="option"
                  class={[
                    "v-combobox__option",
                    {
                      "v-combobox__option--highlighted":
                        index() === highlightedIndex(),
                      "v-combobox__option--selected":
                        option.value === field.value(),
                      "v-combobox__option--disabled": option.disabled,
                    },
                  ]}
                  aria-selected={
                    option.value === field.value() ? "true" : undefined
                  }
                  aria-disabled={option.disabled ? "true" : undefined}
                  onMouseEnter={() =>
                    !option.disabled && setHighlightedIndex(index())
                  }
                  onMouseDown={() => selectOption(option)}
                >
                  {option.label}
                </li>
              )}
            </For>
          </ul>
        </div>
      </Show>
    </div>
  );
}
