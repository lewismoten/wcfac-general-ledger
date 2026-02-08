import FormControl from "@mui/material/FormControl"
import InputLabel from "@mui/material/InputLabel"
import MenuItem from "@mui/material/MenuItem"
import Select from "@mui/material/Select"
import { useEffect, useMemo, useState, type ChangeEvent, type FunctionComponent, type ReactElement } from "react"

type SelectChangeEvent = ChangeEvent<Omit<HTMLInputElement, "value"> & { value: number }> | (Event & { target: { value: number; name: string } });

interface YearSelectProps {
  value: number,
  max?: number,
  min?: number,
  fiscal?: boolean
  onChange?: (value: number) => void
}

export const YearSelect: FunctionComponent<YearSelectProps> = ({
  value = new Date().getFullYear(),
  max = new Date().getFullYear(),
  min = max - 4,
  fiscal = false,
  onChange = () => { }
}) => {

  const [selectedYear, setSelectedYear] = useState(value);

  const handleChangeYear = (event: SelectChangeEvent) => {
    const newValue = event.target.value;
    if (newValue !== selectedYear) {
      setSelectedYear(newValue);
      onChange(newValue);
    }
  }
  const yearMenuItem = (year:number) => {
    const text = fiscal ? `FY${year}` : year;
    return <MenuItem key={year} value={year}>{text}</MenuItem>;
  }
  useEffect(() => {
    if (value === selectedYear) return;
    setSelectedYear(value);
    onChange(value);
  }, [value])
  const items = useMemo((): ReactElement[] => {
    const years = [];
    if(selectedYear < min) {
      years.push(yearMenuItem(selectedYear))
    }
    for (let year = min; year <= max; year++) {
      years.push(yearMenuItem(year))
    }
    if(selectedYear > max) {
      years.push(yearMenuItem(selectedYear))
    }
    return years;
  }, [min, max, fiscal])

  return <FormControl fullWidth>
    <InputLabel id="selected-year-label">Year</InputLabel>
    <Select
      labelId="selected-year-label"
      id="selected-year"
      value={selectedYear}
      label={fiscal ? "Fiscal Year" : "Year"}
      onChange={handleChangeYear}
    >
      {items}
    </Select>
  </FormControl>
}