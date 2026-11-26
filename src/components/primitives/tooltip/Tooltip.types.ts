import { Placement } from "../../../primitives/createPosition";

export interface TooltipProps {
  content: string;
  placement?: Placement;
  delay?: number;
  offset?: number;
  disabled?: boolean;
  class?: string;
}
