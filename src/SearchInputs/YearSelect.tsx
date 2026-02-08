import FormControl from "@mui/material/FormControl"
import InputLabel from "@mui/material/InputLabel"
import MenuItem from "@mui/material/MenuItem"
import Select from "@mui/material/Select"
import { useEffect, useMemo, type ChangeEvent, type FunctionComponent, type ReactElement } from "react"
import { readIntParam } from "./readIntParam"
import { useSearchParams } from "react-router-dom"

type SelectChangeEvent = ChangeEvent<Omit<HTMLInputElement, "value"> & { value: number }> | (Event & { target: { value: number; name: string } });

interface YearSelectProps {
  max?: number,
  min?: number,
  fiscal?: boolean
  id?: string,
  label?: string
}

const invalid = Number.MIN_SAFE_INTEGER;
export const YearSelect: FunctionComponent<YearSelectProps> = ({
  max = new Date().getFullYear(),
  min = max - 4,
  fiscal = false,
  id = 'year',
  label = fiscal ? 'Fiscal Year' : 'Year'
}) => {

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedYear = useMemo(() =>
    readIntParam(searchParams, id, invalid)
  , [searchParams.get(id)]) 

  useEffect(() => {
    let now = new Date();
    let fiscalYear = now.getFullYear();
    if(fiscal && now.getMonth() >= 6)
      fiscalYear++;

    if(selectedYear < min || 
      selectedYear > max || 
      selectedYear > fiscalYear || 
      selectedYear === invalid
    ) {
      searchParams.set(id, fiscalYear.toString());
      setSearchParams();
    }
  }, [selectedYear]);

  const items = useMemo((): ReactElement[] => {
    const years = [];
    const menuItems = [];

    const yearMenuItem = (year: number) => {
      const text = fiscal ? `FY${year}` : year;
      return <MenuItem key={year} value={year}>{text}</MenuItem>;
    }

    for (let year = min; year <= max; year++) {
      years.push(year);
      menuItems.push(yearMenuItem(year))
    }
    return menuItems;
  }, [min, max, fiscal])

  const handleChangeYear = (event: SelectChangeEvent) => {
    const newValue = event.target.value;
    if (newValue !== selectedYear) {
      searchParams.set(id, newValue.toString());
      setSearchParams(searchParams);
    }
  }

  return <FormControl fullWidth>
    <InputLabel id={`selected-${id}-label`}>{label}</InputLabel>
    <Select
      labelId={`selected-${id}-label`}
      id={`selected-${id}`}
      value={selectedYear}
      label={fiscal ? "Fiscal Year" : "Year"}
      onChange={handleChangeYear}
    >
      {items}
    </Select>
  </FormControl>
}