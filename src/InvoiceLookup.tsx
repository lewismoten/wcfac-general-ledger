import { useCallback, useMemo, type ChangeEvent, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query';

export const InvoiceLookup = ({ level, value = "-1", onChange, visible = true, label }: { label: string, level: string, value: string, onChange: (id: string) => void, visible?: boolean }): ReactNode => {

  const { isFetching, error, data } = useQuery({
    queryKey: [`invoice`, level],
    enabled: true,
    queryFn: async () => {
      const res = await fetch(`/api/lookup-invoice.php?level=${level}`);
      return res.json();
    }
  });

  const options = useMemo(() => {
    if (isFetching) return <option>Fetching</option>;
    if (error) return <option>Error</option>;
    if (!data) return <option>No Data</option>;
    return [{ id: "-1", name: "All" }, ...data].map(({ id, name }) => (
      <option value={id} key={id} selected={value === id}>{name}</option>
    ));
  }, [data, error, isFetching, value])

  const changeSelected = useCallback((event: ChangeEvent<HTMLSelectElement>): void => {
    const selectedValue = event.currentTarget.selectedOptions[0].value ?? value;
    if (selectedValue !== value)
      onChange(selectedValue);
  }, [onChange, value]);

  return visible ? <div>{label}<select onChange={changeSelected}>{options}</select></div> : null;

}
