import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

export type ApiFieldErrors = Record<string, string[] | undefined>;

type ApiResultLike = {
  message?: string;
  errors?: ApiFieldErrors;
};

export function applyServerFormErrors<TFieldValues extends FieldValues>(
  setError: UseFormSetError<TFieldValues>,
  errors?: ApiFieldErrors,
  fieldMap?: Partial<Record<string, Path<TFieldValues>>>
) {
  if (!errors) {
    return false;
  }

  let hasAppliedError = false;

  Object.entries(errors).forEach(([field, messages]) => {
    const message = messages?.[0];

    if (!message) {
      return;
    }

    const mappedField = fieldMap?.[field] ?? (field as Path<TFieldValues>);

    setError(mappedField, {
      type: "server",
      message
    });
    hasAppliedError = true;
  });

  return hasAppliedError;
}

export function getApiErrorMessage(
  result: ApiResultLike,
  fallbackMessage: string
) {
  const firstFieldMessage = result.errors
    ? Object.values(result.errors).flatMap((messages) => messages ?? [])[0]
    : undefined;

  return result.message || firstFieldMessage || fallbackMessage;
}
