import { type ChangeEvent, type ReactNode } from 'react'
import { drillDownLevels } from './utils';
export const SeriesPicker = ({ selected = ["fy"], onChange }: { selected: string[], onChange: (selected: string[]) => void }): ReactNode => {

  function change(event: ChangeEvent<HTMLInputElement>): void {
    const value = event.currentTarget.value;
    if (selected.includes(value)) {
      onChange(selected.filter(s => s !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  return <div>{
    drillDownLevels.map(level => (
      <><input
        type="checkbox" radioGroup="series-picker"
        onChange={change} value={level} key={level}
        checked={selected.includes(level)}
      />{level}</>
    ))
  }</div>
}
