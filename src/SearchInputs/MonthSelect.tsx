import FormControl from "@mui/material/FormControl"
import InputLabel from "@mui/material/InputLabel"
import MenuItem from "@mui/material/MenuItem"
import Select from "@mui/material/Select"
import { useEffect, useMemo, type ChangeEvent, type FunctionComponent } from "react"
import { useSearchParams } from "react-router-dom"
import { readIntParam } from "./readIntParam"

type SelectChangeEvent = ChangeEvent<Omit<HTMLInputElement, "value"> & { value: number }> | (Event & { target: { value: number; name: string } });

interface MonthSelectProps {
  fiscal?: boolean,
  id?: string,
  label?: string
}
const invalid = Number.MIN_SAFE_INTEGER;
export const MonthSelect: FunctionComponent<MonthSelectProps> = ({
  fiscal = false,
  id = 'month',
  label = 'Month'
}) => {

  const [searchParams, setSearchParams] = useSearchParams();

  const selectedMonth = useMemo(() =>
    readIntParam(searchParams, id, invalid)
    , [searchParams.get(id)])

  const monthItems = useMemo(() => {
    const firstMonth = fiscal ? 7 : 1;
    const values = [];

    const l18n = new Intl.DateTimeFormat(navigator.language, {month: 'long'});

    const monthName = (index:number):string => {
      const month = (firstMonth + index) % 12;
      const date = new Date(2000, month - 1, 1);
      return l18n.format(date);
    }

    for(let i = 0; i < 11; i++) {
      values.push(<MenuItem key={i} value={i}>{monthName(i)}</MenuItem>)
    }
    return values;
  }, [fiscal]);

  useEffect(() => {
    if (selectedMonth < 1 ||
      selectedMonth > 12 ||
      selectedMonth === invalid
    ) {
      const now = new Date();
      const month = now.getMonth() + 1;
      searchParams.set(id, month.toString());
      setSearchParams(searchParams);
    }
  }, [selectedMonth]);

  const handleChangeMonth = (event: SelectChangeEvent) => {
    const newValue = event.target.value;
    if (newValue === selectedMonth) return;
    searchParams.set(id, newValue.toString());
    setSearchParams(searchParams);
  }

  return <FormControl fullWidth>
    <InputLabel id={`selected-${id}-label`}>{label}</InputLabel>
    <Select
      labelId={`selected-${id}-label`}
      id={`selected-${id}`}
      value={selectedMonth}
      label={label}
      onChange={handleChangeMonth}
    >
      {monthItems}
    </Select>
  </FormControl>
}