import { FieldBindProps } from "../utils";

export type TextareaResize = "none" | "vertical" | "horizontal" | "both";

export interface TextareaProps extends FieldBindProps<string> {
  placeholder?: string;
  rows?: number;
  maxLenght?: number;
  resize?: TextareaResize;
  /** Automatically expands height to fir content as the user types */
  autoResize?: boolean;
}
