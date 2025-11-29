import { useCallback, useMemo, type ReactNode, type SyntheticEvent } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { drillDownLevels } from './utils';
import TextField from '@mui/material/TextField';
import Autocomplete, { type AutocompleteChangeDetails, type AutocompleteChangeReason } from '@mui/material/Autocomplete';

export const CoaLookup = ({ name, values = [], onChange, visible = true, label, searchParams = "" }: { label: string, name: string, values: string[], onChange: (id: string[]) => void, visible?: boolean, searchParams: string }): ReactNode => {

  const params = useMemo(() => {
    const params = new URLSearchParams(searchParams);
    const idx = drillDownLevels.indexOf(name);
    if (idx !== -1) {
      for (let i = idx; i < drillDownLevels.length; i++) {
        if (params.has(drillDownLevels[i])) {
          params.delete(drillDownLevels[i]);
        }
      }
    }
    if (params.has('series')) params.delete('series');
    return params.toString();
  }, [searchParams]);
  const { data } = useQuery<{ id: string, name: string }[]>({
    queryKey: ['coa', name, params],
    placeholderData: keepPreviousData,
    enabled: true,
    queryFn: async () => {
      const res = await fetch(`/api/lookup-coa.php?type=${name}&${params}`);
      return res.json();
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
      onChange(selectedValues);
    };
  }, [onChange, values]);

  if (!visible) return null;

  return <Autocomplete
    multiple
    options={data ?? []}
    getOptionLabel={(option) => option.name}
    onChange={changeSelected}
    renderInput={(params) => (
      <TextField {...params} label={label} />
    )}
    sx={{ width: '500px' }}
  />
}
