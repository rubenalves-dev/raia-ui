import { For, Show, createMemo, createSignal } from "solid-js";
import {
  Badge,
  BadgeVariant,
  Button,
  ButtonSize,
  ButtonVariant,
  Divider,
  ICONS,
  Icon,
  IconName,
  IconSize,
  Placement,
  Spinner,
  SpinnerSize,
  SpinnerVariant,
  createClickOutside,
  createDisclosure,
  createPosition,
  createTooltip,
} from "raia-ui";
import { Tooltip } from "../src/components/primitives/tooltip/Tooltip";
import "./App.css";

const BUTTON_VARIANTS: ButtonVariant[] = [
  "primary",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
];

const BUTTON_SIZES: ButtonSize[] = ["sm", "md", "lg"];

const BADGE_VARIANTS: BadgeVariant[] = [
  "default",
  "secondary",
  "outline",
  "destructive",
  "success",
  "info",
];

const SPINNER_VARIANTS: SpinnerVariant[] = ["blocks", "bars", "ring"];
const SPINNER_SIZES: SpinnerSize[] = ["xs", "sm", "md", "lg", "xl"];
const ICON_SIZES: IconSize[] = ["xs", "sm", "md", "lg", "xl"];
const PLACEMENTS: Placement[] = [
  "top",
  "top-start",
  "top-end",
  "bottom",
  "bottom-start",
  "bottom-end",
  "left",
  "right",
];
const ALL_ICONS = Object.keys(ICONS) as IconName[];

export function App() {
  // Button state
  const [btnLoading, setBtnLoading] = createSignal(false);
  const [btnDisabled, setBtnDisabled] = createSignal(false);

  // Icon filter
  const [iconQuery, setIconQuery] = createSignal("");
  const filteredIcons = createMemo(() => {
    const q = iconQuery().trim().toLowerCase();
    return q ? ALL_ICONS.filter((name) => name.includes(q)) : ALL_ICONS;
  });

  // Tooltip component state
  const [tipPlacement, setTipPlacement] = createSignal<Placement>("top");
  const [tipText, setTipText] = createSignal("Helpful tooltip content");
  const [tipDisabled, setTipDisabled] = createSignal(false);

  // createDisclosure demo
  const disclosure = createDisclosure();

  // createClickOutside demo
  const outsideMenu = createDisclosure();
  const [outsideCount, setOutsideCount] = createSignal(0);
  let outsideBoxRef: HTMLDivElement | undefined;
  createClickOutside(
    () => outsideBoxRef,
    () => {
      setOutsideCount((c) => c + 1);
      outsideMenu.close();
    },
    { enabled: outsideMenu.isOpen },
  );

  // createPosition demo
  const [posOpen, setPosOpen] = createSignal(false);
  const [posPlacement, setPosPlacement] =
    createSignal<Placement>("bottom-start");
  const pos = createPosition(() => ({
    placement: posPlacement(),
    offset: 8,
    open: posOpen,
  }));

  // createTooltip primitive demo
  const [rawTipEl, setRawTipEl] = createSignal<HTMLSpanElement | undefined>();
  createTooltip(
    rawTipEl,
    () => ({
      content: "Attached via createTooltip() primitive",
      placement: "right",
      delay: 150,
    }),
  );

  return (
    <div class="pg-layout">
      <header class="pg-header">
        <div>
          <h1 class="pg-title">raia-ui Playground</h1>
          <p class="pg-subtitle">
            Interactive showcase of existing UI components and headless
            primitives.
          </p>
        </div>
        <nav class="pg-nav" aria-label="Sections">
          <a href="#components">Components</a>
          <a href="#primitives">Primitives</a>
        </nav>
      </header>

      <h2 id="components" class="pg-section-heading">
        Components
      </h2>

      <div class="pg-grid">
        {/* Button */}
        <section class="pg-card">
          <div class="pg-card-header">
            <div>
              <h3 class="pg-card-title">Button</h3>
              <p class="pg-card-desc">
                Variants, sizes, icons, loading and disabled states, and
                polymorphic rendering.
              </p>
            </div>
            <div class="pg-row">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBtnLoading((v) => !v)}
              >
                {btnLoading() ? "Stop Loading" : "Toggle Loading"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBtnDisabled((v) => !v)}
              >
                {btnDisabled() ? "Enable" : "Disable"}
              </Button>
            </div>
          </div>

          <div class="pg-group">
            <span class="pg-label">Variants</span>
            <div class="pg-row">
              <For each={BUTTON_VARIANTS}>
                {(variant) => (
                  <Button
                    variant={variant}
                    isLoading={btnLoading()}
                    disabled={btnDisabled()}
                  >
                    {variant}
                  </Button>
                )}
              </For>
            </div>
          </div>

          <div class="pg-group">
            <span class="pg-label">Sizes &amp; Icons</span>
            <div class="pg-row">
              <For each={BUTTON_SIZES}>
                {(size) => (
                  <Button
                    size={size}
                    isLoading={btnLoading()}
                    disabled={btnDisabled()}
                  >
                    Size {size}
                  </Button>
                )}
              </For>
              <Button
                size="icon"
                variant="outline"
                aria-label="Add item"
                isLoading={btnLoading()}
                disabled={btnDisabled()}
              >
                <Icon name="plus" />
              </Button>
              <Button
                variant="secondary"
                isLoading={btnLoading()}
                disabled={btnDisabled()}
              >
                <Icon name="download" size="sm" />
                Download
              </Button>
              <Button as="a" variant="link">
                Anchor link
                <Icon name="external-link" size="xs" />
              </Button>
            </div>
          </div>
        </section>

        {/* Badge */}
        <section class="pg-card">
          <div class="pg-card-header">
            <div>
              <h3 class="pg-card-title">Badge</h3>
              <p class="pg-card-desc">
                Status and category labels across all variants.
              </p>
            </div>
          </div>
          <div class="pg-row">
            <For each={BADGE_VARIANTS}>
              {(variant) => <Badge variant={variant}>{variant}</Badge>}
            </For>
          </div>
        </section>

        {/* Divider */}
        <section class="pg-card">
          <div class="pg-card-header">
            <div>
              <h3 class="pg-card-title">Divider</h3>
              <p class="pg-card-desc">
                Horizontal, labeled, dashed, and vertical separators.
              </p>
            </div>
          </div>

          <div class="pg-group">
            <span class="pg-label">Horizontal</span>
            <Divider />
          </div>

          <div class="pg-group">
            <span class="pg-label">With Label &amp; Dashed</span>
            <Divider>or continue with</Divider>
            <Divider dashed>dashed section</Divider>
          </div>

          <div class="pg-group">
            <span class="pg-label">Vertical</span>
            <div class="pg-vertical-demo">
              <span>Docs</span>
              <Divider orientation="vertical" decorative />
              <span>API</span>
              <Divider orientation="vertical" dashed decorative />
              <span>Changelog</span>
            </div>
          </div>
        </section>

        {/* Spinner */}
        <section class="pg-card">
          <div class="pg-card-header">
            <div>
              <h3 class="pg-card-title">Spinner</h3>
              <p class="pg-card-desc">
                Loading indicators in blocks, bars, and ring variants.
              </p>
            </div>
          </div>

          <div class="pg-group">
            <span class="pg-label">Variants</span>
            <div class="pg-row">
              <For each={SPINNER_VARIANTS}>
                {(variant) => (
                  <div class="pg-spinner-cell">
                    <Spinner
                      variant={variant}
                      size="lg"
                      label={`${variant} spinner`}
                    />
                    <span>{variant}</span>
                  </div>
                )}
              </For>
            </div>
          </div>

          <div class="pg-group">
            <span class="pg-label">Sizes</span>
            <div class="pg-row">
              <For each={SPINNER_SIZES}>
                {(size) => (
                  <div class="pg-spinner-cell">
                    <Spinner size={size} label={`Size ${size}`} />
                    <span>{String(size)}</span>
                  </div>
                )}
              </For>
            </div>
          </div>
        </section>

        {/* Icon */}
        <section class="pg-card">
          <div class="pg-card-header">
            <div>
              <h3 class="pg-card-title">Icon ({ALL_ICONS.length})</h3>
              <p class="pg-card-desc">
                Built-in SVG icon set with preset sizes.
              </p>
            </div>
            <input
              class="pg-input"
              type="search"
              placeholder="Filter icons..."
              value={iconQuery()}
              onInput={(e) => setIconQuery(e.currentTarget.value)}
            />
          </div>

          <div class="pg-group">
            <span class="pg-label">Sizes</span>
            <div class="pg-row">
              <For each={ICON_SIZES}>
                {(size) => (
                  <div class="pg-row">
                    <Icon name="settings" size={size} />
                    <span class="pg-code">{String(size)}</span>
                  </div>
                )}
              </For>
            </div>
          </div>

          <div class="pg-group">
            <span class="pg-label">Catalog</span>
            <div class="pg-icon-grid">
              <For each={filteredIcons()}>
                {(name) => (
                  <div class="pg-icon-item">
                    <Icon name={name} size="md" />
                    <span>{name}</span>
                  </div>
                )}
              </For>
            </div>
          </div>
        </section>

        {/* Tooltip */}
        <section class="pg-card">
          <div class="pg-card-header">
            <div>
              <h3 class="pg-card-title">Tooltip</h3>
              <p class="pg-card-desc">
                Hover or focus triggers with reactive placement, content, and
                disabled props.
              </p>
            </div>
          </div>

          <div class="pg-group">
            <div class="pg-controls">
              <label class="pg-row">
                <span class="pg-label">Placement</span>
                <select
                  class="pg-select"
                  value={tipPlacement()}
                  onChange={(e) =>
                    setTipPlacement(e.currentTarget.value as Placement)
                  }
                >
                  <For each={PLACEMENTS}>
                    {(p) => <option value={p}>{p}</option>}
                  </For>
                </select>
              </label>

              <label class="pg-row">
                <span class="pg-label">Content</span>
                <input
                  class="pg-input"
                  type="text"
                  value={tipText()}
                  onInput={(e) => setTipText(e.currentTarget.value)}
                />
              </label>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setTipDisabled((d) => !d)}
              >
                {tipDisabled() ? "Enable Tooltip" : "Disable Tooltip"}
              </Button>
            </div>

            <div class="pg-row">
              <Tooltip
                content={tipText()}
                placement={tipPlacement()}
                disabled={tipDisabled()}
              >
                <Button variant="primary">Hover or focus me</Button>
              </Tooltip>

              <Tooltip content="Bottom placement" placement="bottom">
                <Button variant="outline">Bottom</Button>
              </Tooltip>

              <Tooltip content="Right placement" placement="right">
                <Button variant="outline">Right</Button>
              </Tooltip>
            </div>
          </div>
        </section>
      </div>

      <h2 id="primitives" class="pg-section-heading">
        Primitives
      </h2>

      <div class="pg-grid">
        {/* createDisclosure */}
        <section class="pg-card">
          <div class="pg-card-header">
            <div>
              <h3 class="pg-card-title">createDisclosure</h3>
              <p class="pg-card-desc">
                Boolean open/close/toggle state helper for panels, modals, and
                menus.
              </p>
            </div>
            <Badge variant={disclosure.isOpen() ? "success" : "secondary"}>
              {disclosure.isOpen() ? "Open" : "Closed"}
            </Badge>
          </div>

          <div class="pg-row">
            <Button size="sm" onClick={disclosure.open}>
              Open
            </Button>
            <Button size="sm" variant="outline" onClick={disclosure.close}>
              Close
            </Button>
            <Button size="sm" variant="secondary" onClick={disclosure.toggle}>
              Toggle
            </Button>
          </div>

          <Show when={disclosure.isOpen()}>
            <div class="pg-disclosure-panel">
              Disclosure content is visible. Use{" "}
              <span class="pg-code">close()</span> or{" "}
              <span class="pg-code">toggle()</span> to hide it.
            </div>
          </Show>
        </section>

        {/* createClickOutside */}
        <section class="pg-card">
          <div class="pg-card-header">
            <div>
              <h3 class="pg-card-title">createClickOutside</h3>
              <p class="pg-card-desc">
                Detects pointer events outside a target element while enabled.
              </p>
            </div>
            <Badge variant="info">Outside clicks: {outsideCount()}</Badge>
          </div>

          <div class="pg-popover-wrap" ref={outsideBoxRef}>
            <Button variant="outline" onClick={outsideMenu.toggle}>
              {outsideMenu.isOpen() ? "Click outside to close" : "Open Popover"}
            </Button>
            <Show when={outsideMenu.isOpen()}>
              <div class="pg-popover-box">
                Clicking inside this box keeps it open. Clicking anywhere
                outside triggers <span class="pg-code">createClickOutside</span>{" "}
                and closes it.
              </div>
            </Show>
          </div>
        </section>

        {/* createPosition */}
        <section class="pg-card">
          <div class="pg-card-header">
            <div>
              <h3 class="pg-card-title">createPosition</h3>
              <p class="pg-card-desc">
                Computes viewport-clamped floating coordinates relative to an
                anchor element.
              </p>
            </div>
            <span class="pg-code">
              x: {pos.x()}px, y: {pos.y()}px, resolved:{" "}
              {pos.resolvedPlacement()}
            </span>
          </div>

          <div class="pg-group">
            <div class="pg-controls">
              <label class="pg-row">
                <span class="pg-label">Placement</span>
                <select
                  class="pg-select"
                  value={posPlacement()}
                  onChange={(e) =>
                    setPosPlacement(e.currentTarget.value as Placement)
                  }
                >
                  <For each={PLACEMENTS}>
                    {(p) => <option value={p}>{p}</option>}
                  </For>
                </select>
              </label>

              <Button size="sm" onClick={() => setPosOpen((o) => !o)}>
                {posOpen() ? "Hide Floating Box" : "Show Floating Box"}
              </Button>
            </div>

            <div class="pg-position-stage">
              <div ref={pos.setAnchor} class="pg-position-anchor">
                Anchor Element
              </div>
              <Show when={posOpen()}>
                <div
                  ref={pos.setFloating}
                  class="pg-position-floating"
                  style={{ left: `${pos.x()}px`, top: `${pos.y()}px` }}
                >
                  I'm a Floating popup
                </div>
              </Show>
            </div>
          </div>
        </section>

        {/* createTooltip */}
        <section class="pg-card">
          <div class="pg-card-header">
            <div>
              <h3 class="pg-card-title">createTooltip</h3>
              <p class="pg-card-desc">
                Headless tooltip primitive attached directly to any DOM element
                ref.
              </p>
            </div>
          </div>

          <span ref={setRawTipEl} tabindex="0" class="pg-tooltip-target">
            <Icon name="info" size="sm" />
            Hover or focus this span
          </span>

          <Tooltip content="Eu sou uma tooltip">
            <span tabindex="0" class="pg-tooltip-target">
              <Icon name="info" size="sm" />
              Hover or focus this span
            </span>
          </Tooltip>
        </section>
      </div>
    </div>
  );
}
