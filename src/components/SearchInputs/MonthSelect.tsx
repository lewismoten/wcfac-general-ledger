import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { useMemo, type FunctionComponent, type ReactElement } from "react";
import { useSearchParamInt } from "../../utils/useSearchParamInt";
import { calendarMonthFromFiscal, currentFiscalMonth } from "../../utils/fiscal";

interface MonthSelectProps {
  fiscal?: boolean;
  id?: string;
  label?: string;
}

const monthName = (calendarMonth: number, locale?: string) => {
  const fmt = new Intl.DateTimeFormat(locale ?? navigator.language, { month: "long" });
  return fmt.format(new Date(2000, calendarMonth - 1, 1));
};

export const MonthSelect: FunctionComponent<MonthSelectProps> = ({
  fiscal = false,
  id = "month",
  label = "Month",
}) => {
  const now = useMemo(() => new Date(), []);
  const defaultValue = fiscal ? currentFiscalMonth(now) : now.getMonth() + 1;

  const [month, setMonth] = useSearchParamInt(id, {
    defaultValue,
    min: 1,
    max: 12,
  });

  const items = useMemo<ReactElement[]>(() => {
    const out: ReactElement[] = [];
    for (let v = 1; v <= 12; v++) {
      const cal = fiscal ? calendarMonthFromFiscal(v) : v;
      out.push(
        <MenuItem key={v} value={v}>
          {monthName(cal)}
        </MenuItem>
      );
    }
    return out;
  }, [fiscal]);

  return (
    <FormControl fullWidth>
      <InputLabel id={`selected-${id}-label`}>{label}</InputLabel>
      <Select
        labelId={`selected-${id}-label`}
        id={`selected-${id}`}
        value={month}
        label={label}
        onChange={(e) => setMonth(Number((e.target as any).value))}
      >
        {items}
      </Select>
    </FormControl>
  );
};
