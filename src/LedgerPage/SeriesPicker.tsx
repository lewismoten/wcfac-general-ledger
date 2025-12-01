import { useMemo, type ChangeEvent, type ReactNode } from 'react'
import { drillDownLevels } from './utils';
import { useSearchParams } from 'react-router-dom';

export const SeriesPicker = (): ReactNode => {
  const [searchParams, setSearchParams] = useSearchParams();

  const name = 'series';
  const values = useMemo(() => {
    const all: string[] = (searchParams.has(name) ? searchParams.get(name)?.split(',') ?? [] : []);
    const nonEmpty = all.filter(s => s.trim() !== '');
    if (nonEmpty.length === 0) return [drillDownLevels[0]];
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

  return <div>{
    drillDownLevels.map(level => (
      <><input
        type="checkbox" radioGroup="series-picker"
        onChange={change} value={level} key={level}
        checked={values.includes(level)}
      />{level}</>
    ))
  }</div>
}
