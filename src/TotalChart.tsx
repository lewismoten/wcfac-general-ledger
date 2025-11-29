import { CartesianGrid, Legend, Bar, BarChart, Tooltip, XAxis, YAxis } from "recharts"
import { colors, formatCurrencyAsUnit, formatCurrency } from "./utils"
import { useMemo } from "react";

export const TotalChart = ({ data, series }: { data: any[], series: string[] }) => {

  const localData = useMemo(() =>
    data
      .filter(row => series.includes(row.name))
      .sort((r1, r2) => series.indexOf(r1.name) - series.indexOf(r2.name))
    , [data, series]);

  return <BarChart responsive width={800} height={400} data={localData}>
    <CartesianGrid strokeDasharray="3 3" />
    <Tooltip formatter={formatCurrency} />
    <XAxis stroke="#333" dataKey="name" fontSize={10} tickLine={true} />
    <YAxis width="auto" tickFormatter={formatCurrencyAsUnit} />
    <Legend />
    {
      series.map((series, idx) =>
        <Bar stackId="a" key={series} dataKey={series} fill={colors[idx % colors.length]} />)
    }</BarChart>

}