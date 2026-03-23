export function asRows<T>(data: T[] | null | undefined): T[] {
  return data ?? [];
}

export function uniqueIds(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}
