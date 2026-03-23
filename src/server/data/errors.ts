import type { PostgrestError } from "@supabase/supabase-js";

export class DataLayerError extends Error {
  readonly context: string;
  readonly details?: unknown;

  constructor(context: string, message: string, details?: unknown) {
    super(message);
    this.name = "DataLayerError";
    this.context = context;
    this.details = details;
  }
}

export function throwIfQueryError(
  context: string,
  error: PostgrestError | null,
): void {
  if (!error) {
    return;
  }

  throw new DataLayerError(
    context,
    `[data] ${context} failed: ${error.message}`,
    {
      code: error.code,
      details: error.details,
      hint: error.hint,
    },
  );
}
