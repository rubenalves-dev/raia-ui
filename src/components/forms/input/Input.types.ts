import { JSX } from "@solidjs/web/jsx-runtime";
import { FieldBindProps } from "../utils/useField";

export type InputType =
  "text" | "email" | "password" | "number" | "tel" | "url" | "search";

export interface InputProps
  extends
    FieldBindProps<string | number>,
    Omit<
      JSX.InputHTMLAttributes<HTMLInputElement>,
      "value" | "onChange" | "onBlur" | "disabled" | "id" | "type"
    > {
  type?: InputType;
}
