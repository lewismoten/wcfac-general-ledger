import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { useMemo, type FunctionComponent, type ReactElement } from "react";
import { useSearchParamInt } from "../utils/useSearchParamInt";
import { currentFiscalYear } from "../utils/fiscal";

interface YearSelectProps {
  max?: number;
  min?: number;
  fiscal?: boolean;
  id?: string;
  label?: string;
}

export const YearSelect: FunctionComponent<YearSelectProps> = ({
  max,
  min,
  fiscal = false,
  id = "year",
  label,
}) => {
  const now = useMemo(() => new Date(), []);
  const defaultYear = fiscal ? currentFiscalYear(now) : now.getFullYear();

  const effectiveMax = max ?? defaultYear;
  const effectiveMin = min ?? effectiveMax - 4;

  const [year, setYear] = useSearchParamInt(id, {
    defaultValue: defaultYear,
    min: effectiveMin,
    max: effectiveMax,
  });

  const items = useMemo<ReactElement[]>(() => {
    const out: ReactElement[] = [];
    for (let y = effectiveMin; y <= effectiveMax; y++) {
      out.push(
        <MenuItem key={y} value={y}>
          {fiscal ? `FY${y}` : y}
        </MenuItem>
      );
    }
    return out;
  }, [effectiveMin, effectiveMax, fiscal]);

  const effectiveLabel = label ?? (fiscal ? "Fiscal Year" : "Year");

  return (
    <FormControl fullWidth>
      <InputLabel id={`selected-${id}-label`}>{effectiveLabel}</InputLabel>
      <Select
        labelId={`selected-${id}-label`}
        id={`selected-${id}`}
        value={year}
        label={effectiveLabel}
        onChange={(e) => setYear(Number((e.target as any).value))}
      >
        {items}
      </Select>
    </FormControl>
  );
};
