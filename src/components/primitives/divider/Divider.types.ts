export type DividerOrientation = "horizontal" | "vertical";

export interface DividerProps {
  orientation?: DividerOrientation;
  dashed?: boolean;
  /** Decorative dividers omit role="separator" from accessibility tree */
  decorative?: boolean;
}
