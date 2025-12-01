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
// import { styled } from '@mui/material/styles';
// import Paper from '@mui/material/Paper';
import { useSearchParams } from 'react-router-dom';
import type { ApiError } from './ApiError';
import { LedgerLookup } from './LedgerLookup';

interface GraphData {
  count: number,
  rows: {
    series: string,
    point: string,
    value: number,
    pointOrder: number
  }[]
}

interface RawGraphData {
  count: number,
  rows: {
    series: string,
    point: string,
    value: string,
    pointOrder: string
  }[]
}

function LedgerPage() {

  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState('');

  const { data, error } = useQuery<GraphData>({
    queryKey: ['chartData', searchParams.toString()],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await fetch(`/api/year-over-year.php?${searchParams.toString()}`);
      return res.json().then((data: RawGraphData | ApiError) => {
        if ('error' in data) {
          console.error(data);
          setErrorMessage(data.error);
          throw data.details;
          // return { count: 0, rows: [] };
        }
        setErrorMessage('');
        return ({
          count: data.count,
          rows: data.rows.map(({ series, point, value, pointOrder }: { series: string, point: string, value: string, pointOrder: string }) => ({
            series,
            point,
            value: parseFloat(value),
            pointOrder: parseFloat(pointOrder)
          }))
        })
      }
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

  // const Item = styled(Paper)(({ theme }) => ({
  //   backgroundColor: '#fff',
  //   ...theme.typography.body2,
  //   padding: theme.spacing(1),
  //   textAlign: 'center',
  //   color: (theme.vars ?? theme).palette.text.secondary,
  //   ...theme.applyStyles('dark', {
  //     backgroundColor: '#1A2027',
  //   }),
  // }));

  const SIZE = { xs: 12, sm:6, md: 3 };

  return (
    <>
      <h1>General Ledger</h1>
      <Alert severity="warning">Not an official resource. Data has been acquired via FOIA by a private citizen and not under the control of Warren County.</Alert>
      {(errorMessage ?? '').trim() === '' ? null : <Alert severity="error">{errorMessage}</Alert>}
      <Grid container spacing={1}>
        <Grid  size={SIZE}>
          <FyLookup name='fy' label="Fiscal Year" />
        </Grid>
        <Grid size={SIZE}>
          <LedgerLookup name='bat' label="Batch" />
        </Grid>
        <Grid size={SIZE}>
          <CoaLookup name='re' label="R/E" />
        </Grid>
        <Grid size={SIZE}>
          <CoaLookup name='ol1' label="OL1" />
        </Grid>
        <Grid size={SIZE}>
          <CoaLookup name='ol1Func' label="Function" />
        </Grid>
        <Grid size={SIZE}>
          <CoaLookup name='ol2' label="OL2" />
        </Grid>
        <Grid size={SIZE}>
          <CoaLookup name='dept' label="Department" />
        </Grid>
        <Grid size={SIZE}>
          <CoaLookup name='acct' label="Account" />
        </Grid>
        <Grid size={SIZE}>
          <CoaLookup name='vend' label="Vendor" />
        </Grid>
        <Grid size={SIZE}>
          <LedgerLookup name='po' label="P/O" />
        </Grid>
        <Grid size={SIZE}>
          <LedgerLookup name='chk' label="Check" />
        </Grid>
        <Grid size={SIZE}>
          <InvoiceLookup level="1" label="Invoice[1]" />
        </Grid>
        <Grid size={SIZE}>
          <InvoiceLookup level="2" label="Invoice[2]" />
        </Grid>
        <Grid size={SIZE}>
          <InvoiceLookup level="3" label="Invoice[3]" />
        </Grid>
        <Grid size={SIZE}>
          <InvoiceLookup level="-1" label="Invoice" />
        </Grid>
      </Grid>

      <SeriesPicker />
      {error ? <b>{error.message}</b> : null}
      {isPaged ? `Paged.` : null}
      <div>Showing {visibleCount} of {totalCount}.</div>
      <Paginator totalCount={totalCount} />
      <MonthlyChart data={monthlyData} series={displayedSeries} />
      <TotalChart data={totalData} series={displayedSeries} />
      <LedgerTable />

    </>
  )
}

export default LedgerPage;
