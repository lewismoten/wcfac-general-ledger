import { useCallback, useMemo, type ReactNode, type SyntheticEvent } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { drillDownLevels } from '../utils';
import TextField from '@mui/material/TextField';
import Autocomplete, { type AutocompleteChangeDetails, type AutocompleteChangeReason } from '@mui/material/Autocomplete';
import { useSearchParams } from 'react-router-dom';

export const CoaLookup = ({ name, label }: { label: string, name: string }): ReactNode => {

  const [searchParams, setSearchParams] = useSearchParams();

  const values = useMemo(() =>
    (searchParams.has(name) ? searchParams.get(name)?.split(',') ?? [] : [])
      .filter(v => v.trim() !== ""),
    [name, searchParams]);

  const params = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    const idx = drillDownLevels.indexOf(name);
    if (idx !== -1) {
      for (let i = idx; i < drillDownLevels.length; i++) {
        if (params.has(drillDownLevels[i])) {
          params.delete(drillDownLevels[i]);
        }
      }
    }
    ['series', 'pg', 'ps'].forEach(key => {
      if (params.has(key)) params.delete(key);
    });
    return params.toString();
  }, [searchParams]);

  const { data } = useQuery<{ id: string, name: string }[]>({
    queryKey: ['coa', name, params],
    placeholderData: keepPreviousData,
    enabled: true,
    queryFn: async () => {
      const res = await fetch(`/api/lookup-coa.php?type=${name}&${params}`);
      return res.json().then((data: { id: number, name: string }[]) =>
        data.map(({ id, name }) => ({
          id: id.toString(),
          name
        })))
    }
  });

  const changeSelected = useCallback((
    _event: SyntheticEvent<Element, Event>,
    value: { id: string; name: string; }[],
    _reason: AutocompleteChangeReason,
    _details?: AutocompleteChangeDetails<{ id: string; name: string; }> | undefined
  ): void => {
    const selectedValues = value.map(v => v.id).sort();
    if (selectedValues.join(',') !== values.join(',')) {
      searchParams.set(name, selectedValues.join(','));
      setSearchParams(searchParams);
    };
  }, [setSearchParams, searchParams, values]);

  return <Autocomplete
    multiple
    options={data ?? []}
    getOptionLabel={(option) => option.name}
    onChange={changeSelected}
    value={values.map(id => ({ id, name: data?.find(d => d.id === id)?.name ?? id }))}
    isOptionEqualToValue={(option, value) => option.id === value.id}
    renderInput={(params) => (
      <TextField {...params} label={label} />
    )}
    sx={{ width: '500px' }}
  />
}
