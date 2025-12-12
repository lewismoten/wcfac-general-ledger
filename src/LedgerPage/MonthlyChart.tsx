import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts"
import { colors, formatCurrency, formatCurrencyAsUnit } from "./utils"

export const MonthlyChart = ({ data, series }: { data: any[], series: string[] }) => {

  if (data === null || data.length === 0) return null;

  return <LineChart responsive width={800} height={800} data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis stroke="#333" dataKey="name" fontSize={10} dy={10} tickLine={true} />
    <YAxis tickFormatter={formatCurrencyAsUnit} />
    <Tooltip formatter={formatCurrency} />
    <Legend />
    {
      series.map((series, idx) =>
        <Line key={series} dataKey={series} stroke={colors[idx % colors.length]} connectNulls />)
    }</LineChart>

}