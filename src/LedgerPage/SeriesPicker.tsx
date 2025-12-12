import { useMemo, type ChangeEvent, type ReactNode } from 'react'
import { levels } from './utils';
import { useSearchParams } from 'react-router-dom';

export const SeriesPicker = (): ReactNode => {
  const [searchParams, setSearchParams] = useSearchParams();

  const name = 'series';
  const values = useMemo(() => {
    const all: string[] = (searchParams.has(name) ? searchParams.get(name)?.split(',') ?? [] : []);
    const nonEmpty = all.filter(s => s.trim() !== '');
    if (nonEmpty.length === 0) return [levels[0].field];
    return nonEmpty;

  }, [name, searchParams]);

  const change = useMemo(() => (event: ChangeEvent<HTMLInputElement>): void => {
    const value = event.currentTarget.value;
    if (values.includes(value)) {
      searchParams.set(name, values.filter(v => v !== value).join(','));
    } else {
      searchParams.set(name, [...values, value].join(','))
    }
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams, values]);

  return <ul>{
    levels.map(level => (
      <li key={level.field}><input
        type="checkbox" radioGroup="series-picker"
        onChange={change} value={level.field}
        checked={values.includes(level.field)}
      />{level.name}</li>
    ))
  }</ul>
}
