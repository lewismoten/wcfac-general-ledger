import { useMemo, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { CoaLookup } from './CoaLookup';
import { FyLookup } from './FyLookup';
import { InvoiceLookup } from './InvoiceLookup';
import { SeriesPicker } from './SeriesPicker';
import { MonthlyChart } from './MonthlyChart';
import { TotalChart } from './TotalChart';
import { Paginator } from './Paginator';
import { LedgerTable } from './LedgerTable';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';

function App() {
  const [fy, setFy] = useState(["-1"]);
  const [re, setRe] = useState<string[]>([]);
  const [ol1, setOl1] = useState<string[]>([]);
  const [ol1Func, setOl1Func] = useState<string[]>([]);
  const [ol2, setOl2] = useState<string[]>([]);
  const [dept, setDept] = useState<string[]>([]);
  const [acct, setAcct] = useState<string[]>([]);
  const [vend, setVend] = useState<string[]>([]);
  const [inv, setInv] = useState<string[]>([]);
  const [inv1, setInv1] = useState<string[]>([]);
  const [inv2, setInv2] = useState<string[]>([]);
  const [inv3, setInv3] = useState<string[]>([]);
  const [series, setSeries] = useState(['fy']);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(1200);

  const showRevenueFields = useMemo(() => re.length === 0 || re.includes('4'), [re]);

  const searchParams = useMemo(() => {
    const params = new URLSearchParams({
      fy: fy.join(","),
      re: re.join(","),
      ol1: ol1.join(","),
      ol1Func: ol1Func.join(","),
      ol2: ol2.join(","),
      dept: dept.join(","),
      acct: acct.join(","),
      vend: vend.join(","),
      inv: inv.join(","),
      inv1: inv1.join(","),
      inv2: inv2.join(","),
      inv3: inv3.join(","),
      series: series.join(','),
      pg: pageNumber.toString(),
      ps: pageSize.toString()
    });
    if (params.get('fy') === '-1') params.delete('fy');
    if (showRevenueFields) {
      if (params.get('ol1') === '') params.delete('ol1');
      if (params.get('ol1Func') === '') params.delete('ol1Func');
      if (params.get('ol2') === '') params.delete('ol2');
      if (params.get('dept') === '') params.delete('dept');
    } else {
      params.delete('ol1');
      params.delete('ol1Func');
      params.delete('ol2');
      params.delete('dept');
    }
    if (params.get('re') === '') params.delete('re');
    if (params.get('acct') === '') params.delete('acct');
    if (params.get('vend') === '') params.delete('vend');

    if (params.get('inv') === '') params.delete('inv');
    if (params.get('inv1') === '') params.delete('inv1');
    if (params.get('inv2') === '') params.delete('inv2');
    if (params.get('inv3') === '') params.delete('inv3');
    if (params.get('series') === '') params.delete('series');
    if (params.get('pg') === '1') params.delete('pg');
    if (params.get('ps') === '1200') params.delete('ps');
    return params.toString();
  }, [
    fy,
    re,
    ol1,
    ol1Func,
    ol2,
    dept,
    acct,
    vend,
    inv,
    inv1,
    inv2,
    inv3,
    series,
    pageNumber,
    pageSize,
    showRevenueFields
  ]);

  const { isFetching, data, error } = useQuery<{ count: number, rows: { series: string, point: string, value: number, pointOrder: number }[] }>({
    queryKey: ['chartData', searchParams],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await fetch(`/api/year-over-year.php?${searchParams}`);
      return res.json().then(data => ({
        count: data.count,
        rows: data.rows.map(({ series, point, value, pointOrder }: { series: string, point: string, value: string, pointOrder: string }) => ({
          series,
          point,
          value: parseFloat(value),
          pointOrder: parseFloat(pointOrder)
        }))
      })
      )
    }

  });

  const [monthlyData, totalData, seriesNames, visibleCount, totalCount, isPaged] = useMemo(() => {
    if (!data || data.count === 0 || data.rows.length === 0) return [[], [], [], 0, 0, false];
    const { rows, count } = data;
    if (rows.length === 0) return [[], [], [], rows.length, count, count > 0];

    const monthData: any[] = [];
    const totalData: any[] = [];
    const totalData2: any[] = [{ name: 'total' }];
    const seriesNames: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const { series, point, value, pointOrder } = rows[i];
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

    totalData.forEach((row) => {
      const value = row[row.name] as number;
      row[row.name] = Math.round(value * 100) * 0.01;
    });

    // sort seriesNames by totalData values for paginating largest to smallest
    seriesNames.sort((s1, s2) => {
      const v1 = totalData.find(d => d.name === s1)[s1];
      const v2 = totalData.find(d => d.name === s2)[s2];
      return v1 < v2 ? 1 : v1 > v2 ? -1 : 0;
    });

    // <pre>{JSON.stringify(monthData, null, '  ')}</pre>
    return [
      monthData,
      totalData,
      seriesNames,
      rows.length,
      count,
      count > rows.length
    ]
  }, [data]);

  const displayedSeries = useMemo(() => {
    if (seriesNames.length === 0) return [];
    return seriesNames.filter(name => name !== 'name').slice(0, 10);
  }, [seriesNames]);

  const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: (theme.vars ?? theme).palette.text.secondary,
    ...theme.applyStyles('dark', {
      backgroundColor: '#1A2027',
    }),
  }));

  return (
    <>
      <h1>General Ledger</h1>
      <Alert severity="warning">Not an official resource. Data has been acquired via FOIA by a private citizen and not under the control of Warren County.</Alert>
      <Grid container spacing={2}>
        <Grid size={6}>
          <Item><FyLookup name='fy' label="Fiscal Year" values={fy} onChange={setFy} /></Item>
        </Grid>
        <Grid size={6}>
          <Item><CoaLookup name='re' label="R/E" values={re} onChange={setRe} searchParams={searchParams} /></Item>
        </Grid>
        <Grid size={6}>
          <Item><CoaLookup name='ol1' label="OL1" visible={showRevenueFields} values={ol1} onChange={setOl1} searchParams={searchParams} /></Item>
        </Grid>
        <Grid size={6}>
          <Item><CoaLookup name='ol1Func' label="Function" visible={showRevenueFields} values={ol1Func} onChange={setOl1Func} searchParams={searchParams} /></Item>
        </Grid>
        <Grid size={6}>
          <Item><CoaLookup name='ol2' label="OL2" visible={showRevenueFields} values={ol2} onChange={setOl2} searchParams={searchParams} /></Item>
        </Grid>
        <Grid size={6}>
          <Item><CoaLookup name='dept' label="Department" visible={showRevenueFields} values={dept} onChange={setDept} searchParams={searchParams} /></Item>
        </Grid>
        <Grid size={6}>
          <Item><CoaLookup name='acct' label="Account" visible values={acct} onChange={setAcct} searchParams={searchParams} /></Item>
        </Grid>
        <Grid size={6}>
          <Item><CoaLookup name='vend' label="Vendor" visible values={vend} onChange={setVend} searchParams={searchParams} /></Item>
        </Grid>
        <Grid size={6}>
          <Item><InvoiceLookup level="1" label="Invoice[1]" visible values={inv1} onChange={setInv1} searchParams={searchParams} /></Item>
        </Grid>
        <Grid size={6}>
          <Item><InvoiceLookup level="2" label="Invoice[2]" visible values={inv2} onChange={setInv2} searchParams={searchParams} /></Item>
        </Grid>
        <Grid size={6}>
          <Item><InvoiceLookup level="3" label="Invoice[3]" visible values={inv3} onChange={setInv3} searchParams={searchParams} /></Item>
        </Grid>
        <Grid size={6}>
          <Item><InvoiceLookup level="-1" label="Invoice" visible values={inv} onChange={setInv} searchParams={searchParams} /></Item>
        </Grid>
      </Grid>

      <SeriesPicker selected={series} onChange={setSeries} />
      {error ? <b>{error.message}</b> : null}
      {isPaged ? `Paged.` : null}
      <div>Showing {visibleCount} of {totalCount}.</div>
      <Paginator pageNumber={pageNumber} pageSize={pageSize} setPageNumber={setPageNumber} totalCount={totalCount} setPageSize={setPageSize} />
      <MonthlyChart data={monthlyData} series={displayedSeries} />
      <TotalChart data={totalData} series={displayedSeries} />
      <LedgerTable searchParams={searchParams} />

    </>
  )
}

export default App
