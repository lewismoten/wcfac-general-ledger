import { useCallback, useMemo, type ChangeEvent, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query';

export const FyLookup = ({ name, values = ["-1"], onChange, visible = true, label }: { label: string, name: string, values: string[], onChange: (id: string[]) => void, visible?: boolean }): ReactNode => {

  const { isFetching, error, data } = useQuery({
    queryKey: [`coa_${name}`],
    enabled: true,
    queryFn: async () => {
      const res = await fetch(`/api/lookup-fy.php?type=${name}`);
      return res.json();
    }
  });

  const options = useMemo(() => {
    if (isFetching) return <option>Fetching</option>;
    if (error) return <option>Error</option>;
    if (!data) return <option>No Data</option>;
    return [{ id: "-1", name: "All" }, ...data].map(({ id, name }) => (
      <option value={id} key={id} selected={values.includes(id)}>{name}</option>
    ));
  }, [data, error, isFetching, values])

  const changeSelected = useCallback((event: ChangeEvent<HTMLSelectElement>): void => {
    let selectedValues = [...event.currentTarget.selectedOptions].map(({ value }) => value);
    if (selectedValues.length > 1 && selectedValues.includes("-1")) {
      selectedValues = selectedValues.filter(value => value !== "-1");
    }
    if (selectedValues.join(",") !== values.join(","))
      onChange(selectedValues);
  }, [onChange, values]);

  return visible ? <div>{label}<select multiple onChange={changeSelected}>{options}</select></div> : null;

}
