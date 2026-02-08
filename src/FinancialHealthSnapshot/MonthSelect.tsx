import FormControl from "@mui/material/FormControl"
import InputLabel from "@mui/material/InputLabel"
import MenuItem from "@mui/material/MenuItem"
import Select from "@mui/material/Select"
import { useEffect, useState, type ChangeEvent, type FunctionComponent } from "react"

type SelectChangeEvent = ChangeEvent<Omit<HTMLInputElement, "value"> & { value: number }> | (Event & { target: { value: number; name: string } });

interface MonthSelectProps {
  value?: number,
  onChange?: (value:number) => void
}
export const MonthSelect: FunctionComponent<MonthSelectProps> = ({
  value = new Date().getMonth()+1,
  onChange = () => {}
}) => {

const [selectedMonth, setSelectedMonth] = useState(value);

  const handleChangeMonth = (event: SelectChangeEvent) => {
    const newValue = event.target.value;
    if(newValue !== selectedMonth) {
      setSelectedMonth(newValue);
      onChange(newValue);
    }
  }
  useEffect(() => {
    if(value === selectedMonth) return;
    setSelectedMonth(value);
    onChange(value);
  }, [value])

return <FormControl fullWidth>
  <InputLabel id="selected-month-label">Month</InputLabel>
  <Select
    labelId="selected-month-label"
    id="selected-month"
    value={selectedMonth}
    label="Month"
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