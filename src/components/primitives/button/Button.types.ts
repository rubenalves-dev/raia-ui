import { JSX } from "@solidjs/web";
import { ValidComponent } from "solid-js";

export type ButtonTag = "button" | "a";
export type ButtonVariant =
  "primary" | "secondary" | "outline" | "ghost" | "destructive" | "link";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends JSX.HTMLAttributes<HTMLElement> {
  as?: ButtonTag | ValidComponent;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}
