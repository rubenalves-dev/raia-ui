import { Accessor, createSignal } from "solid-js";

export interface CreateDisclosureOpts {
  defaultOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

export interface Disclosure {
  readonly isOpen: Accessor<boolean>;
  readonly open: () => void;
  readonly close: () => void;
  readonly toggle: () => void;
}

export function createDisclosure(opts: CreateDisclosureOpts = {}): Disclosure {
  const [isOpen, setIsOpen] = createSignal(opts.defaultOpen ?? false);

  function open(): void {
    if (isOpen()) return;
    setIsOpen(true);
    opts.onOpen?.();
  }

  function close(): void {
    if (!isOpen()) return;
    setIsOpen(false);
    opts.onClose?.();
  }

  function toggle(): void {
    if (isOpen()) close();
    else open();
  }

  return { isOpen, open, close, toggle };
}
