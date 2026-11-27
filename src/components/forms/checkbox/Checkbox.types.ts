import { FieldBindProps } from "../utils";

export interface CheckboxProps extends FieldBindProps<boolean> {
  indeterminate?: boolean;
  required?: boolean;

  onTouch?: () => void;
}
