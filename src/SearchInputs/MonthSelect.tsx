import FormControl from "@mui/material/FormControl"
import InputLabel from "@mui/material/InputLabel"
import MenuItem from "@mui/material/MenuItem"
import Select from "@mui/material/Select"
import { useEffect, useMemo, type ChangeEvent, type FunctionComponent } from "react"
import { useSearchParams } from "react-router-dom"
import { readIntParam } from "./readIntParam"

type SelectChangeEvent = ChangeEvent<Omit<HTMLInputElement, "value"> & { value: number }> | (Event & { target: { value: number; name: string } });

interface MonthSelectProps {
  id?: string,
  label?: string
}
const invalid = Number.MIN_SAFE_INTEGER;
export const MonthSelect: FunctionComponent<MonthSelectProps> = ({
  id = 'month',
  label = 'Month'
}) => {

  const [searchParams, setSearchParams] = useSearchParams();

  const selectedMonth = useMemo(() =>
    readIntParam(searchParams, id, invalid)
    , [searchParams.get(id)])

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
      <MenuItem value={7}>July</MenuItem>
      <MenuItem value={8}>August</MenuItem>
      <MenuItem value={9}>September</MenuItem>
      <MenuItem value={10}>October</MenuItem>
      <MenuItem value={11}>November</MenuItem>
      <MenuItem value={12}>December</MenuItem>
      <MenuItem value={1}>January</MenuItem>
      <MenuItem value={2}>February</MenuItem>
      <MenuItem value={3}>March</MenuItem>
      <MenuItem value={4}>April</MenuItem>
      <MenuItem value={5}>May</MenuItem>
      <MenuItem value={6}>June</MenuItem>
    </Select>
  </FormControl>
}