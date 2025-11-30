import { useCallback, useMemo, type ChangeEvent, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

export const FyLookup = ({ name, label }: { label: string, name: string }): ReactNode => {
  const [searchParams, setSearchParams] = useSearchParams();
  const values = useMemo(() =>
    (searchParams.has(name) ? searchParams.get(name)?.split(',') ?? [] : [])
      .filter(v => v.trim() !== '')
    , [name, searchParams]);

  const { isFetching, error, data } = useQuery({
    queryKey: ['coa', name],
    enabled: true,
    queryFn: async () => {
      const res = await fetch(`/api/lookup-fy.php?type=${name}`);
      return res.json();
    }
  });

  const options = useMemo(() => {
    if (!data) {
      if (isFetching) return <option>Fetching</option>;
      if (error) return <option>Error</option>;
      return <option>No Data</option>;
    }
    return [{ id: "-1", name: "All" }, ...data].map(({ id, name }) => (
      <option value={id} key={id} selected={values.includes(id.toString())}>{name}</option>
    ));
  }, [data, error, isFetching, values])

  const changeSelected = useCallback((event: ChangeEvent<HTMLSelectElement>): void => {
    let selectedValues = [...event.currentTarget.selectedOptions].map(({ value }) => value);
    if (selectedValues.length > 1 && selectedValues.includes("-1")) {
      selectedValues = selectedValues.filter(value => value !== "-1");
    }
    if (selectedValues.join(",") !== values.join(","))
      searchParams.set(name, selectedValues.join(','));
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams, values]);

  return <div>{label}<select multiple onChange={changeSelected}>{options}</select></div>;

}
