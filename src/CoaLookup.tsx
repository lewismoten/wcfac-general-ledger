import { useMemo, type ChangeEvent, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query';

export const CoaLookup = ({ name, value = "-1", onChange }: { name: string, value: string, onChange: (id: string) => void }): ReactNode => {

  const { isFetching, error, data } = useQuery({
    queryKey: [`coa_${name}`],
    enabled: true,
    queryFn: async () => {
      const res = await fetch(`/api/lookup-coa.php?type=${name}`);
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

  const changeSelected = (event: ChangeEvent<HTMLSelectElement>): void => {
    const selectedValue = event.currentTarget.selectedOptions[0].value ?? value;
    if (selectedValue !== value)
      onChange(selectedValue);
  }

  return <select onChange={changeSelected}>{options}</select>

}
