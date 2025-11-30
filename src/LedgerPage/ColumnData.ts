import type { Data } from "./Data";

export interface ColumnData {
  dataKey: keyof Data;
  label: string;
  tip: string,
  numeric?: boolean;
  width?: number;
  colorScale?: boolean;
}
