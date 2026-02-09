import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export interface UseSearchParamIntOptions {
  defaultValue: number;
  min?: number;
  max?: number;
}

/**
 * Reads an int querystring param, validates/clamps it, and provides a setter.
 * Returns the effective value (always valid) and a setValue() function.
 */
export const useSearchParamInt = (
  key: string,
  options: UseSearchParamIntOptions
): readonly [number, (next: number) => void] => {
  const { defaultValue, min, max } = options;
  const [searchParams, setSearchParams] = useSearchParams();

  const raw = useMemo(() => searchParams.get(key), [searchParams, key]);

  const value = useMemo(() => {
    const n = raw == null || raw === "" ? NaN : Number(raw);
    let v = Number.isFinite(n) ? Math.trunc(n) : defaultValue;

    if (typeof min === "number" && v < min) v = min;
    if (typeof max === "number" && v > max) v = max;

    return v;
  }, [raw, defaultValue, min, max]);

  const setValue = useCallback(
    (next: number) => {
      let v = Math.trunc(next);
      if (!Number.isFinite(v)) return;

      if (typeof min === "number" && v < min) v = min;
      if (typeof max === "number" && v > max) v = max;

      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        p.set(key, String(v));
        return p;
      });
    },
    [key, min, max, setSearchParams]
  );

  return [value, setValue] as const;
};
