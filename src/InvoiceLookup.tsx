import { useCallback, useMemo, type ChangeEvent, type ReactNode } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { drillDownLevels } from './utils';

export const InvoiceLookup = ({ level, value = "-1", onChange, visible = true, label, searchParams }: { label: string, level: string, value: string, onChange: (id: string) => void, visible?: boolean, searchParams: string }): ReactNode => {

  const params = useMemo(() => {
    const params = new URLSearchParams(searchParams);
    const idx = drillDownLevels.indexOf(`inv${level === "-1" ? "" : level}`);
    if (idx !== -1) {
      for (let i = idx; i < drillDownLevels.length; i++) {
        if (params.has(drillDownLevels[i])) {
          params.delete(drillDownLevels[i]);
        }
      }
    }
    return params.toString();
  }, [searchParams]);

  const { isFetching, error, data } = useQuery({
    queryKey: [`invoice`, level, params],
    enabled: true,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await fetch(`/api/lookup-invoice.php?level=${level}&${params}`);
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
