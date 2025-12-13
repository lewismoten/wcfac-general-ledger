import { useMemo, forwardRef } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { TableVirtuoso, type TableComponents } from 'react-virtuoso';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { SxProps } from '@mui/system/styleFunctionSx';
import { interpolateColor } from './utils';
import type { Data } from './Data';
import { columns } from './columns';
import type { ApiError } from './ApiError';
import { useSearchParams } from 'react-router-dom';
import { ExportData } from './ExportData';

const VirtuosoTableComponents: TableComponents<Data> = {
  Scroller: forwardRef<HTMLDivElement>((props, ref) => (
    <TableContainer component={Paper} {...props} ref={ref} />
  )),
  Table: (props) => (
    <Table {...props} sx={{ borderCollapse: 'separate', tableLayout: 'fixed' }} />
  ),
  TableHead: forwardRef<HTMLTableSectionElement>((props, ref) => (
    <TableHead {...props} ref={ref} />
  )),
  TableRow,
  TableBody: forwardRef<HTMLTableSectionElement>((props, ref) => (
    <TableBody {...props} ref={ref} />
  )),
};

function fixedHeaderContent() {
  return (
    <TableRow>
      {columns.map((column) => (
        <TableCell
          key={column.dataKey}
          variant="head"
          title={column.tip}
          align={column.numeric || false ? 'right' : 'left'}
          style={{ width: column.width }}
          sx={{ backgroundColor: 'background.paper', fontSize: 'smaller', fontFamily: 'monospace', padding: '2px' }}
        >
          {column.label}
        </TableCell>
      ))}
    </TableRow>
  );
}
const rowContent = (minNet: number, maxNet: number, medianNet: number) => (_index: number, row: Data) => {

  const colorMin = '#58a858';
  const colorMedian = '#ffffff';
  const colorMax = '#be3838';

  return (<>
    {columns.map((column) => {
      const sx: SxProps = { fontSize: 'smaller', fontFamily: 'monospace', padding: '2px' };
      if (column.colorScale) {
        const value = row[column.dataKey] as number;
        if (value === minNet) {
          sx.backgroundColor = colorMin;
        } else if (value === maxNet) {
          sx.backgroundColor = colorMax;
        } else if (value === medianNet) {
          sx.backgroundColor = colorMedian;
        } else if (value < medianNet) {
          let percent = (value - minNet) / (medianNet - minNet);
          sx.backgroundColor = interpolateColor(colorMin, colorMedian, percent);
        } else {
          let percent = (value - medianNet) / (maxNet - medianNet);
          sx.backgroundColor = interpolateColor(colorMedian, colorMax, percent);
        }
      }
      return (
        <TableCell
          sx={sx}
          key={column.dataKey}
          align={column.numeric || false ? 'right' : 'left'}
        >
          {row[column.dataKey]}
        </TableCell>
      )
    })}
  </>)
}
type LedgerPage = {
  rows: Data[],
  nextPage: number | null;
  total?: number,
  maxNet: number,
  minNet: number,
  medianNet: number
}
export const LedgerTable = () => {
  const [searchParams] = useSearchParams();

  const localParams = useMemo(() => {
    const params = new URLSearchParams(searchParams);
    ['series', 'pg', 'ps'].forEach(key => {
      if (params.has(key)) params.delete(key);
    });
    return params.toString();
  }, [searchParams]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<LedgerPage | ApiError>({
    queryKey: ['ledgerData', localParams],
    initialPageParam: 1,
    getNextPageParam: (lastPage) => "error" in lastPage ? undefined : lastPage.nextPage ?? undefined,
    queryFn: async ({ pageParam }) => {
      const base = localParams ? `${localParams}&` : "";
      const PAGE_SIZE = 100;
      const res = await fetch(`/api/ledger.php?${base}pg=${pageParam}&ps=${PAGE_SIZE}`);
      return res.json();
    }
  });
  const [rows, minNet, maxNet, medianNet, total]: [Data[], number, number, number, number] = useMemo(() => {
    const pages = (data?.pages.filter(page => !("error" in page)) || []) as LedgerPage[];
    const lastPage = pages.at(-1);

    return [
      pages.flatMap(page => page.rows) ?? [],
      lastPage?.minNet ?? 0,
      lastPage?.maxNet ?? 0,
      lastPage?.medianNet ?? 0,
      lastPage?.total ?? -1
    ];
  }
    , [data]
  );
  const itemContent = useMemo(() => rowContent(minNet, maxNet, medianNet), [minNet, maxNet, medianNet]);
  return <Paper style={{ height: 800, width: '100%' }}>
    <ExportData total={total} localParams={localParams} />
    <TableVirtuoso
      data={rows ?? []}
      components={VirtuosoTableComponents}
      fixedHeaderContent={fixedHeaderContent}
      itemContent={itemContent}
      endReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }}
    />
  </Paper>
}

