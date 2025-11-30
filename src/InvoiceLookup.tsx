import { useCallback, useMemo, type ReactNode, type SyntheticEvent } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { drillDownLevels } from './utils';
import TextField from '@mui/material/TextField';
import Autocomplete, { type AutocompleteChangeDetails, type AutocompleteChangeReason } from '@mui/material/Autocomplete';

export const InvoiceLookup = ({ level, values = [], onChange, visible = true, label, searchParams }: { label: string, level: string, values: string[], onChange: (ids: string[]) => void, visible?: boolean, searchParams: string }): ReactNode => {

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
    if (params.has('series')) params.delete('series');
    return params.toString();
  }, [searchParams]);

  const { data } = useQuery<{ id: string, name: string }[]>({
    queryKey: [`invoice`, level, params],
    enabled: true,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await fetch(`/api/lookup-invoice.php?level=${level}&${params}`);
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
    value={values.map(id => ({ id, name: data?.find(d => d.id === id)?.name ?? id }))}
    isOptionEqualToValue={(option, value) => option.id === value.id}
    renderInput={(params) => (
      <TextField {...params} label={label} />
    )}
    sx={{ width: '500px' }}
  />

}
