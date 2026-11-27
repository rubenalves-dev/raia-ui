import {
  createEffect,
  createMemo,
  createSignal,
  For,
  merge,
  Show,
} from "solid-js";
import { createClickOutside, createDisclosure } from "../../../primitives";
import {
  DEFAULT_DATE_FORMAT,
  formatDate,
  parseToIsoDate,
} from "../../../utils/dates";
import { omitFieldProps, useField } from "../utils";
import "./DatePicker.scss";
import {
  CalendarDay,
  DatePickerProps,
  MONTH_NAMES,
  WEEK_DAYS,
} from "./DatePicker.types";
import { Tooltip } from "../../primitives/tooltip/Tooltip";
import { Button, Icon } from "../../primitives";

const defaults: Partial<DatePickerProps> = {
  format: DEFAULT_DATE_FORMAT,
  clearable: true,
};

export function DatePicker(props: DatePickerProps) {
  const merged = merge(defaults, props);
  const field = useField(merged);
  const rest = omitFieldProps(merged);

  const [pickerRef, setPickerRef] = createSignal<HTMLDivElement | undefined>();

  const disclosure = createDisclosure({
    onOpen: () => rest.onOpen?.(),
    onClose: () => {
      field.onBlur();
      rest.onClose?.();
    },
  });

  createClickOutside(pickerRef, () => disclosure.close());
  createClickOutside(pickerRef, () => disclosure.close());

  const [viewDate, setViewDate] = createSignal<Date>(
    (prev) => parseIsoLocal(field.value()) ?? prev ?? new Date(),
  );
  const [inputDisplay, setInputDisplay] = createSignal("");
  const [parseError, setParseError] = createSignal(false);

  const effectivePlaceholder = createMemo(
    () => merged.placeholder || merged.format,
  );
  const hasError = createMemo(() => Boolean(field.invalid || parseError()));

  const monthYearLabel = createMemo(
    () => `${MONTH_NAMES[viewDate().getMonth()]} ${viewDate().getFullYear()}`,
  );

  function formatIsoDate(year: number, month: number, day: number): string {
    const dt = new Date(year, month - 1, day);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function parseIsoLocal(iso: string): Date | null {
    if (!iso) return null;
    const parts = iso.split("-").map(Number);
    if (
      parts.length === 3 &&
      !parts.some(isNaN) &&
      parts[0] !== undefined &&
      parts[1] !== undefined &&
      parts[2] !== undefined
    ) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return null;
  }

  createEffect(
    () => [field.value(), merged.format],
    ([val, pattern]) => {
      if (!val) {
        setInputDisplay("");
        setParseError(false);
        return;
      }

      setInputDisplay(formatDate(val, { pattern, fallback: val }));
      setParseError(false);
    },
  );

  const calendarDays = createMemo<CalendarDay[]>(() => {
    const vd = viewDate();
    const year = vd.getFullYear();
    const month = vd.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Start week at MONDAY instead of SUNDAY
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: CalendarDay[] = [];
    const today = new Date();
    const todayIso = formatIsoDate(
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate(),
    );
    const selectedIso = field.value();

    // Previous month filter days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - 1;
      const iso = formatIsoDate(year, month, d);
      days.push({
        date: new Date(year, month - 1, d),
        isoDate: iso,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: iso === todayIso,
        isSelected: iso === selectedIso,
      });
    }

    // Current month days
    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      const iso = formatIsoDate(year, month + 1, d);
      days.push({
        date: new Date(year, month, d),
        isoDate: iso,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: iso === todayIso,
        isSelected: iso === selectedIso,
      });
    }

    // next month fillter days to complete a 42-day (6 * 7 grid)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const iso = formatIsoDate(year, month + 2, d);
      days.push({
        date: new Date(year, month + 1, d),
        isoDate: iso,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: iso === todayIso,
        isSelected: iso === selectedIso,
      });
    }

    return days;
  });

  function onSelectDate(isoDate: string): void {
    field.set(isoDate);
    rest.onChange?.(isoDate);
  }

  function prevMonth(): void {
    const vd = viewDate();
    setViewDate(new Date(vd.getFullYear(), vd.getMonth() - 1, 1));
  }

  function nextMonth(): void {
    const vd = viewDate();
    setViewDate(new Date(vd.getFullYear(), vd.getMonth() + 1, 1));
  }

  function onSelectDay(day: CalendarDay): void {
    if (field.disabled()) return;
    onSelectDate(day.isoDate);
    disclosure.close();
  }

  function onSelectToday(): void {
    if (field.disabled()) return;
    const today = new Date();
    onSelectDate(
      formatIsoDate(today.getFullYear(), today.getMonth() + 1, today.getDate()),
    );
    disclosure.close();
  }

  function onClearValue(): void {
    if (field.disabled()) return;
    setParseError(false);
    onSelectDate("");
    disclosure.close();
  }

  function onInputChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const val = target.value;
    setInputDisplay(val);

    if (!val.trim()) {
      setParseError(merged.required ?? false);
      if (!merged.required) onSelectDate("");
      return;
    }

    const iso = parseToIsoDate(val, merged.format);
    if (iso) {
      setParseError(false);
      onSelectDate(iso);
    } else {
      setParseError(true);
    }
  }

  function onInputBlur(): void {
    field.onBlur();
    if (parseError()) {
      setInputDisplay(
        field.value()
          ? formatDate(field.value(), {
              pattern: merged.format,
              fallback: field.value(),
            })
          : "",
      );
    }
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape" && disclosure.isOpen()) {
      event.preventDefault();
      disclosure.close();
    }
  }

  const rootClasses = () => [
    "v-date-picker",
    {
      "v-date-picker--open": disclosure.isOpen(),
      "v-date-picker--disabled": field.disabled(),
      "v-date-picker--invalid": hasError(),
    },
  ];

  return (
    <div ref={setPickerRef} class={rootClasses()} onKeyDown={onKeydown}>
      <div class="v-date-picker__control">
        <input
          id={field.id()}
          type="text"
          class="v-date-picker__input"
          autocomplete="off"
          value={inputDisplay()}
          placeholder={effectivePlaceholder()}
          disabled={field.disabled()}
          required={rest.required}
          aria-expanded={disclosure.isOpen() ? "true" : undefined}
          aria-haspopup="dialog"

          onInput={onInputChange}
          onBlur={onInputBlur}
          onClick={() => disclosure.open()}
        />

        <div class="v-date-picker__actions">
          <Show when={rest.clearable && field.value() && !field.disabled()}>
            <Tooltip content="Clear Date">
              <button
                type="button"
                class="v-date-picker__action-btn"
                aria-label="Clear Date"
                tabindex="-1"

                onClick={onClearValue}
              >
                <Icon name="x" size="xs" />
              </button>
            </Tooltip>
          </Show>

          <Tooltip content="Toogle calendar">
            <button
              type="button"
              class="v-date-picker__action-btn"
              disabled={field.disabled()}
              aria-label="Toogle calendar"
              tabindex="-1"

              onClick={disclosure.toggle}
            >
              <Icon name="calendar" size="xs" />
            </button>
          </Tooltip>
        </div>
      </div>

      <Show when={disclosure.isOpen()}>
        <div
          class="v-date-picker__dropdown"
          role="dialog"
          aria-modal="true"
          aria-label={monthYearLabel()}
        >
          <div class="v-date-picker__header">
            <button
              type="button"
              class="v-date-picker__nav-btn"
              title="Previous month"
              aria-label="Previous month"
              onClick={prevMonth}
            >
              <Icon name="chevron-left" size="xs" />
            </button>

            <span class="v-date-picker__title">{monthYearLabel()}</span>

            <button
              type="button"
              class="v-date-picker__nav-btn"
              title="Next month"
              aria-label="Next month"
              onClick={nextMonth}
            >
              <Icon name="chevron-right" size="xs" />
            </button>
          </div>

          <div class="v-date-picker__weekdays">
            <For each={WEEK_DAYS}>
              {(wd) => <span class="v-date-picker__weekday">{wd}</span>}
            </For>
          </div>

          <div class="v-date-picker__days-grid">
            <For each={calendarDays()}>
              {(d) => (
                <button
                  type="button"
                  class={[
                    "v-date-picker__day",
                    {
                      "v-date-picker__day--outside": !d.isCurrentMonth,
                      "v-date-picker__day--today": d.isToday,
                      "v-date-picker__day--selected": d.isSelected,
                    },
                  ]}
                  aria-pressed={d.isSelected ? "true" : undefined}
                  onClick={() => onSelectDay(d)}
                >
                  {d.dayNumber}
                </button>
              )}
            </For>
          </div>

          <div class="v-date-picker__footer">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSelectToday}
            >
              Today
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={disclosure.close}
            >
              Close
            </Button>
          </div>
        </div>
      </Show>
    </div>
  );
}
