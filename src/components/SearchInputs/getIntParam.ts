export const getIntParam = (
  params: URLSearchParams,
  name: string,
  defaultValue: number,
  options?: {
    min?: number;
    max?: number;
  }
): number => {
  const raw = params.get(name);
  if (raw == null || raw === '') return defaultValue;

  // Strict integer check (no "12foo")
  if (!/^-?\d+$/.test(raw)) return defaultValue;

  let value = Number(raw);

  if (!Number.isSafeInteger(value)) return defaultValue;

  if (options?.min !== undefined && value < options.min) {
    value = options.min;
  }
  if (options?.max !== undefined && value > options.max) {
    value = options.max;
  }

  return value;
};
