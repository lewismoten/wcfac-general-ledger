import { useMemo, useState, type ChangeEvent } from 'react'
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
  const [coaReId, setCoaReId] = useState("-1");

  const coaRe = useQuery({
    queryKey: ['coa_re'],
    enabled: true,
    queryFn: async () => {
      const res = await fetch('/api/lookup-coa-re.php');
      return res.json();
    }
  });
  const ff = useQuery({
    queryKey: ['chartData', coaReId],
    queryFn: async () => {
      const res = await fetch(`/api/year-over-year.php?re=${coaReId}`);
      return res.json();
    }
  });

  const getData = () => {
    if (ff.isFetching) return;
    ff.refetch();
  }
  const coaReOptions = useMemo(() => {
    if (coaRe.isFetching) return <option>Fetching</option>;
    if (coaRe.error) return <option>Error</option>;
    if (!coaRe.data) return <option>No Data</option>;
    const data: { id: string, name: string }[] = [{ id: "-1", name: "Any R/E" }, ...coaRe.data];
    return data.map(({ id, name }) => (
      <option value={id} key={id} selected={coaReId === id}>{name}</option>
    ));
  }, [coaRe.data, coaRe.error, coaRe.isFetching, coaReId])
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
    const formatTickY = (value: any): string =>
      (value * 0.000001).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 1,
      }) + 'M';

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
  }, [ff.data])

  const changeCoaReId = (event: ChangeEvent<HTMLSelectElement>): void => {
    const selectedId = event.currentTarget.selectedOptions[0].value;
    setCoaReId(selectedId ?? "");
  }

  return (
    <>
      <h1>General Ledger</h1>
      <select onChange={changeCoaReId}>{coaReOptions}</select>
      <button onClick={getData}>{ff.isFetching ? 'Loading...' : 'Get Data'}</button>
      {ff.error ? <b>{ff.error.message}</b> : null}
      {prettyData}

    </>
  )
}

export default App
