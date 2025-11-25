import { useMemo, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Legend } from 'recharts';
import { CoaLookup } from './CoaLookup';
import { FyLookup } from './FyLookup';

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
  const [fy, setFy] = useState(["-1"]);
  const [re, setRe] = useState("-1");
  const [ol1, setOl1] = useState("-1");
  const [ol1Func, setOl1Func] = useState("-1");
  const [ol2, setOl2] = useState("-1");
  const [dept, setDept] = useState("-1");

  const { isFetching, data, error } = useQuery<{ series: string, point: string, value: number, pointOrder: number }[]>({
    queryKey: ['chartData', fy, re, ol1, ol1Func, ol2, dept],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const params = new URLSearchParams({
        fy: fy.join(","),
        re,
        ol1, ol1Func, ol2, dept
      });
      if (params.get('fy') === '-1') params.delete('fy');
      if (params.get('re') !== '4' && params.get('re') !== '-1') {
        params.delete('ol1');
        params.delete('ol1Func');
        params.delete('ol2');
        params.delete('dept');
      } else {
        if (params.get('ol1') === '-1') params.delete('ol1');
        if (params.get('ol1Func') === '-1') params.delete('ol1Func');
        if (params.get('ol2') === '-1') params.delete('ol2');
        if (params.get('dept') === '-1') params.delete('dept');
      }
      if (params.get('re') === '-1') params.delete('re');

      const res = await fetch(`/api/year-over-year.php?${params.toString()}`);
      return res.json().then(data => data.map(({ series, point, value, pointOrder }: { series: string, point: string, value: string, pointOrder: string }) => ({
        series,
        point,
        value: parseFloat(value),
        pointOrder: parseFloat(pointOrder)
      })));
    }
  });

  const maxValue = useMemo(() => {
    let defaultMax = 100000000;
    if (!data) return defaultMax;
    if (data.length === 0) return defaultMax;
    let max = data.reduce((max, { value }) => value > max ? value : max, -1);
    if (max === -1) return defaultMax;
    return max;
  }, [data]);

  const prettyData = useMemo(() => {
    if (!data) return null;

    const chartData: any[] = [];
    const seriesNames: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const { series, point, value, pointOrder } = data[i];
      if (!seriesNames.includes(series)) {
        seriesNames.push(series)
      }
      let idx = chartData.findIndex(d => d.name === point);
      if (idx === -1) {
        chartData.push({
          name: point,
          sort: pointOrder,
          [series]: value
        });
      } else {
        let x = chartData[idx];
        if (series in x) {
          x[series] += value;
        } else {
          x[series] = value;
        }
      }

    }
    chartData.sort((x1, x2) => x1.sort > x2.sort ? 1 : x1.sort < x2.sort ? -1 : 0);

    let multiplier = 1;
    let unit = '';
    let maximumFractionDigits = 1;

    if (maxValue > 2000000) {
      multiplier = 0.000001;
      unit = 'M';
      if (maxValue > 10000000) {
        maximumFractionDigits = 0;
      }
    } else if (maxValue > 2000) {
      multiplier = 0.001;
      unit = 'K';
      if (maxValue > 10000) {
        maximumFractionDigits = 0;
      }
    }
    const formatTickY = (value: any): string =>
      (value * multiplier).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits,
      }) + unit;

    // <pre>{JSON.stringify(chartData, null, '  ')}</pre>
    return <div>
      <LineChart width={800} height={400} data={chartData}>
        <XAxis stroke="#333" dataKey="name" fontSize={10} dy={10} tickLine={true} />
        <YAxis tickFormatter={formatTickY} />
        <Legend />
        {
          seriesNames.map((series, idx) =>
            <Line key={series} dataKey={series} stroke={colors[idx % colors.length]} />)
        }</LineChart>
    </div>
  }, [data, maxValue])

  return (
    <>
      <h1>General Ledger</h1>
      <FyLookup name='fy' label="Fiscal Year" values={fy} onChange={setFy} />
      <CoaLookup name='re' label="R/E" value={re} onChange={setRe} />
      <CoaLookup name='ol1' label="OL1" visible={re === "-1" || re === "4"} value={ol1} onChange={setOl1} />
      <CoaLookup name='ol1Func' label="Function" visible={re === "-1" || re === "4"} value={ol1Func} onChange={setOl1Func} />
      <CoaLookup name='ol2' label="OL2" visible={re === "-1" || re === "4"} value={ol2} onChange={setOl2} />
      <CoaLookup name='dept' label="Department" visible={re === "-1" || re === "4"} value={dept} onChange={setDept} />
      {error ? <b>{error.message}</b> : null}
      {prettyData}
      {isFetching ? 'Loading...' : 'Ready'}

    </>
  )
}

export default App
