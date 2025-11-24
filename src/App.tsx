import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Legend } from 'recharts';

function App() {
  const ff = useQuery({
    queryKey: ['chartData'],
    enabled: false,
    staleTime: Infinity,
    queryFn: async () => {
      const res = await fetch('/api/test.php');
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
    const vendorNames: string[] = [];

    for (let i = 0; i < ff.data.length; i++) {
      const { CHECK_DATE, NET_AMOUNT } = ff.data[i];
      const VENDOR_NAME = 'pv';
      const netAmount = parseFloat(NET_AMOUNT);
      if (!vendorNames.includes(VENDOR_NAME)) {
        vendorNames.push(VENDOR_NAME)
      }
      let idx = chartData.findIndex(d => d.name === CHECK_DATE);
      if (idx === -1) {
        chartData.push({
          name: CHECK_DATE,
          [VENDOR_NAME]: netAmount
        });
      } else {
        let x = chartData[idx];
        if (VENDOR_NAME in x) {
          x[VENDOR_NAME] += netAmount;
        } else {
          x[VENDOR_NAME] = netAmount;
        }
      }

    }
    chartData.sort((x1, x2) => x1.name > x2.name ? 1 : x1.name < x2.name ? -1 : 0);
    return <div>
      <pre>{JSON.stringify(chartData, null, '  ')}</pre>
      <LineChart width={400} height={400} data={chartData}>
        <XAxis stroke="#333" dataKey="name" fontSize={12} dy={10} tickLine={false} />
        <YAxis />
        <Legend />
        {
          vendorNames.map(name => <Line key={name} type="monotone" dataKey={name} stroke="#8884d8" />)
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
