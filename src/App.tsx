import { useMemo, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { CoaLookup } from './CoaLookup';
import { FyLookup } from './FyLookup';
import { InvoiceLookup } from './InvoiceLookup';
import { SeriesPicker } from './SeriesPicker';
import { MonthlyChart } from './MonthlyChart';
import { TotalChart } from './TotalChart';




function App() {
  const [fy, setFy] = useState(["-1"]);
  const [re, setRe] = useState("-1");
  const [ol1, setOl1] = useState("-1");
  const [ol1Func, setOl1Func] = useState("-1");
  const [ol2, setOl2] = useState("-1");
  const [dept, setDept] = useState("-1");
  const [acct, setAcct] = useState("-1");
  const [vend, setVend] = useState("-1");
  const [inv, setInv] = useState("-1");
  const [inv1, setInv1] = useState("-1");
  const [inv2, setInv2] = useState("-1");
  const [inv3, setInv3] = useState("-1");
  const [series, setSeries] = useState(['fy']);

  const searchParams = useMemo(() => {
    const params = new URLSearchParams({
      fy: fy.join(","),
      re,
      ol1, ol1Func, ol2, dept,
      acct,
      vend,
      inv, inv1, inv2, inv3,
      series: series.join(',')
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
    if (params.get('acct') === '-1') params.delete('acct');
    if (params.get('vend') === '-1') params.delete('vend');

    if (params.get('inv') === '-1') params.delete('inv');
    if (params.get('inv1') === '-1') params.delete('inv1');
    if (params.get('inv2') === '-1') params.delete('inv2');
    if (params.get('inv3') === '-1') params.delete('inv3');
    if (params.get('series') === '') params.delete('series');

    return params.toString();
  }, [fy, re, ol1, ol1Func, ol2, dept, acct, vend, inv, inv1, inv2, inv3, series])
  const { isFetching, data, error } = useQuery<{ series: string, point: string, value: number, pointOrder: number }[]>({
    queryKey: ['chartData', searchParams],
    placeholderData: keepPreviousData,
    queryFn: async () => {

      const res = await fetch(`/api/year-over-year.php?${searchParams}`);
      return res.json().then(data => data.map(({ series, point, value, pointOrder }: { series: string, point: string, value: string, pointOrder: string }) => ({
        series,
        point,
        value: parseFloat(value),
        pointOrder: parseFloat(pointOrder)
      })));
    }
  });

  const [monthlyData, totalData, seriesNames] = useMemo(() => {
    if (!data) return [[], [], []];

    const monthData: any[] = [];
    const totalData: any[] = [];
    const totalData2: any[] = [{ name: 'total' }];
    const seriesNames: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const { series, point, value, pointOrder } = data[i];
      if (!seriesNames.includes(series)) {
        seriesNames.push(series);
        totalData.push({ name: series, [series]: [value] });
        totalData2[0][series] = value;
      } else {
        const o = totalData.find(d => d.name === series)!;
        o[series] = parseFloat(o[series]) + value;
        totalData2[0][series] = parseFloat(totalData2[0][series]) + value;
      }
      let idx = monthData.findIndex(d => d.name === point);
      if (idx === -1) {
        monthData.push({
          name: point,
          sort: pointOrder,
          [series]: value
        });
      } else {
        let x = monthData[idx];
        if (series in x) {
          x[series] = parseFloat(x[series]) + value;
        } else {
          x[series] = value;
        }
      }

    }
    monthData.sort((x1, x2) => x1.sort > x2.sort ? 1 : x1.sort < x2.sort ? -1 : 0);

    totalData.forEach((data) => {
      const value = data[data.name] as number;
      data[data.name] = Math.round(value * 100) * 0.01;
    });

    // sort seriesNames by totalData values for paginating largest to smallest
    seriesNames.sort((s1, s2) => {
      const v1 = totalData.find(d => d.name === s1)[s1];
      const v2 = totalData.find(d => d.name === s2)[s2];
      console.log({ [s1]: v1, [s2]: v2, sort: v1 < v2 ? 1 : v1 > v2 ? -1 : 0 })
      return v1 < v2 ? 1 : v1 > v2 ? -1 : 0;
    });

    // <pre>{JSON.stringify(monthData, null, '  ')}</pre>
    return [
      monthData,
      totalData,
      seriesNames
    ]
  }, [data]);

  const displayedSeries = useMemo(() => {
    if (seriesNames.length === 0) return [];
    return seriesNames.filter(name => name !== 'name').slice(0, 10);
  }, [seriesNames]);

  return (
    <>
      <h1>General Ledger</h1>
      <FyLookup name='fy' label="Fiscal Year" values={fy} onChange={setFy} />
      <CoaLookup name='re' label="R/E" value={re} onChange={setRe} searchParams={searchParams} />
      <CoaLookup name='ol1' label="OL1" visible={re === "-1" || re === "4"} value={ol1} onChange={setOl1} searchParams={searchParams} />
      <CoaLookup name='ol1Func' label="Function" visible={re === "-1" || re === "4"} value={ol1Func} onChange={setOl1Func} searchParams={searchParams} />
      <CoaLookup name='ol2' label="OL2" visible={re === "-1" || re === "4"} value={ol2} onChange={setOl2} searchParams={searchParams} />
      <CoaLookup name='dept' label="Department" visible={re === "-1" || re === "4"} value={dept} onChange={setDept} searchParams={searchParams} />
      <CoaLookup name='acct' label="Account" visible value={acct} onChange={setAcct} searchParams={searchParams} />
      <CoaLookup name='vend' label="Vendor" visible value={vend} onChange={setVend} searchParams={searchParams} />
      <InvoiceLookup level="1" label="Invoice[1]" visible value={inv1} onChange={setInv1} searchParams={searchParams} />
      <InvoiceLookup level="2" label="Invoice[2]" visible value={inv2} onChange={setInv2} searchParams={searchParams} />
      <InvoiceLookup level="3" label="Invoice[3]" visible value={inv3} onChange={setInv3} searchParams={searchParams} />
      <InvoiceLookup level="-1" label="Invoice" visible value={inv} onChange={setInv} searchParams={searchParams} />
      <SeriesPicker selected={series} onChange={setSeries} />
      {error ? <b>{error.message}</b> : null}
      <MonthlyChart data={monthlyData} series={displayedSeries} />
      <TotalChart data={totalData} series={displayedSeries} />
      {isFetching ? 'Loading...' : 'Ready'}

    </>
  )
}

export default App
