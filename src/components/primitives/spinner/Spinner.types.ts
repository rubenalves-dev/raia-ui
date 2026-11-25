export const SPINNER_SIZES = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 28,
  xl: 40,
} as const;

export type SpinnerSize = keyof typeof SPINNER_SIZES | number | (string & {});
export type SpinnerVariant = "blocks" | "bars" | "ring";

export interface SpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  /** Accessible label for standalone spinner (hidden when decorative inside a button) */
  label?: string;
}
