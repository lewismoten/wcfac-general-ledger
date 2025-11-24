import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Legend } from 'recharts';

const colors = [
  "#3366CC",
  "#DC3912",
  "#FF9900",
  "#109618",
  "#990099",
  "#0099C6",
  "#DD4477",
  "#66AA00",
  "#B82E2E",
  "#316395",
  "#994499",
  "#22AA99",
  "#AAAA11",
  "#6633CC",
  "#E67300",
  "#8B0707",
  "#651067",
  "#329262",
  "#5574A6",
  "#3B3EAC"
];

function App() {
  const ff = useQuery({
    queryKey: ['chartData'],
    enabled: false,
    staleTime: Infinity,
    queryFn: async () => {
      const res = await fetch('/api/year-over-year.php');
      return res.json();
    }
  });

  const getData = () => {
    if (ff.isFetching) return;

    ff.refetch();
  }

  const prettyData = useMemo(() => {
    if (!ff.data) return null;

    const chartData: any[] = [];
    const seriesNames: string[] = [];

    for (let i = 0; i < ff.data.length; i++) {
      const { series, point, value, pointOrder } = ff.data[i];
      const valueF = parseFloat(value);
      if (!seriesNames.includes(series)) {
        seriesNames.push(series)
      }
      let idx = chartData.findIndex(d => d.name === point);
      if (idx === -1) {
        chartData.push({
          name: point,
          sort: pointOrder,
          [series]: valueF
        });
      } else {
        let x = chartData[idx];
        if (series in x) {
          x[series] += valueF;
        } else {
          x[series] = valueF;
        }
      }

    }
    chartData.sort((x1, x2) => x1.pointOrder < x2.pointOrder ? 1 : x1.pointOrder > x2.pointOrder ? -1 : 0);
    // <pre>{JSON.stringify(chartData, null, '  ')}</pre>
    return <div>
      <LineChart width={800} height={400} data={chartData}>
        <XAxis stroke="#333" dataKey="name" fontSize={10} dy={10} tickLine={true} />
        <YAxis />
        <Legend />
        {
          seriesNames.map((series, idx) =>
            <Line key={series} dataKey={series} stroke={colors[idx % colors.length]} />)
        }</LineChart>
    </div>
  }, [ff.data])

  return (
    <>
      <h1>General Ledger</h1>
      <button onClick={getData}>{ff.isFetching ? 'Loading...' : 'Get Data'}</button>
      {ff.error ? <b>{ff.error.message}</b> : null}
      {prettyData}

    </>
  )
}

export default App
