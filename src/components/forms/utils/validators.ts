import type {
  ArrayPath,
  AsyncFieldValidator,
  FieldPath,
  FieldValidator,
  SchemaPath,
} from "./types";

export function validate<T>(path: FieldPath<T>, fn: FieldValidator<T>): void {
  path.__validators.push(fn);
}

export function validateAsync<T>(
  path: FieldPath<T>,
  fn: AsyncFieldValidator<T>,
): void {
  path.__asyncValidators.push(fn);
}

export function applyEach<Item>(
  path: ArrayPath<Item>,
  fn: (itemPath: SchemaPath<Item>) => void,
): void {
  path.__itemSchemas.push(fn);
}

export function required<T>(
  path: FieldPath<T>,
  opts: { message?: string } = {},
): void {
  const message = opts.message ?? "This field is required";
  validate(path, ({ value }) => {
    if (value === null || value === undefined) {
      return { kind: "required", message };
    }
    if (typeof value === "string" && value.trim() === "") {
      return { kind: "required", message };
    }
    if (Array.isArray(value) && value.length === 0) {
      return { kind: "required", message };
    }
    return null;
  });
}

export function minLength(
  path: FieldPath<string>,
  min: number,
  opts: { message?: string } = {},
): void {
  const message = opts.message ?? `Minimum ${min} characters`;
  validate(path, ({ value }) =>
    value && value.length < min ? { kind: "minLength", message } : null,
  );
}

export function maxLength(
  path: FieldPath<string>,
  max: number,
  opts: { message?: string } = {},
): void {
  const message = opts.message ?? `Maximum ${max} characters`;
  validate(path, ({ value }) =>
    value && value.length > max ? { kind: "maxLength", message } : null,
  );
}

export function email(
  path: FieldPath<string>,
  opts: { message?: string } = {},
): void {
  const message = opts.message ?? "Invalid email address";
  validate(path, ({ value }) =>
    value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ? { kind: "email", message }
      : null,
  );
}

export function pattern(
  path: FieldPath<string>,
  regex: RegExp,
  opts: { message?: string } = {},
): void {
  const message = opts.message ?? "Invalid format";
  validate(path, ({ value }) =>
    value && !regex.test(value) ? { kind: "pattern", message } : null,
  );
}
