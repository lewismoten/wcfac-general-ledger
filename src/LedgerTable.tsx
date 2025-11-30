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

interface Data {
  id: number,
  poNo: string;
  vendorNo: string;
  vendorName: string;
  invoiceNo: string;
  invoiceDate: string;
  accountNo: string;
  accountPaid: string;
  netAmount: string;
  checkNo: number,
  checkDate: string;
  description: string;
  batchNo: number
}

interface ApiError {
  error: string,
  details: string,
  sql?: string,
  types?: string,
  params?: any[],
  state?: string
}

interface ColumnData {
  dataKey: keyof Data;
  label: string;
  tip: string,
  numeric?: boolean;
  width?: number;
  colorScale?: boolean;
}

const columns: ColumnData[] = [
  {
    width: 70,
    label: 'P/O NO.',
    tip: "Purchase Order Number",
    dataKey: 'poNo',
    numeric: true,
  },
  {
    width: 70,
    label: 'VEND. NO.',
    tip: "Vendor Number",
    dataKey: 'vendorNo',
    numeric: true,
  },
  {
    width: 200,
    label: 'VENDOR NAME',
    tip: "Vendor Name",
    dataKey: 'vendorName',
  },
  {
    width: 100,
    label: 'INVOICE NO.',
    tip: "Invoice Number",
    dataKey: 'invoiceNo',
  },
  {
    width: 75,
    label: 'INVOICE DATE',
    tip: "Invoice Date",
    dataKey: 'invoiceDate',
  },
  {
    width: 200,
    label: 'ACCOUNT NO.',
    tip: "Account Number",
    dataKey: 'accountNo',
  },
  {
    width: 75,
    label: 'ACCOUNT PD',
    tip: "Account Paid",
    dataKey: 'accountPaid',
  },
  {
    width: 75,
    label: 'NET AMOUNT',
    tip: "Net amount",
    dataKey: 'netAmount',
    numeric: true,
    colorScale: true
  },
  {
    width: 65,
    label: 'CHECK NO.',
    tip: "Check Number",
    dataKey: 'checkNo',
    numeric: true,
  },
  {
    width: 75,
    label: 'CHECK DATE',
    tip: "Check Date",
    dataKey: 'checkDate',
  },
  {
    width: 200,
    label: 'DESCRIPTION',
    tip: "Description",
    dataKey: 'description',
  },
  {
    width: 65,
    label: 'BATCH',
    tip: "Batch Number",
    dataKey: 'batchNo',
    numeric: true,
  },
];

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
export const LedgerTable = ({ searchParams = "" }: { searchParams: string }) => {
  const localParams = useMemo(() => {
    const params = new URLSearchParams(searchParams);
    if (params.has('series')) params.delete('series');
    if (params.has('pg')) params.delete('pg');
    if (params.has('ps')) params.delete('ps');
    return params.toString();
  }, [searchParams]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<LedgerPage | ApiError>({
    queryKey: ['legerData', localParams],
    initialPageParam: 1,
    getNextPageParam: (lastPage) => "error" in lastPage ? undefined : lastPage.nextPage ?? undefined,
    queryFn: async ({ pageParam }) => {
      const base = localParams ? `${localParams}&` : "";
      const PAGE_SIZE = 100;
      const res = await fetch(`/api/ledger.php?${base}pg=${pageParam}&ps=${PAGE_SIZE}`);
      return res.json();
    }
  });
  const [rows, minNet, maxNet, medianNet]: [Data[], number, number, number] = useMemo(() => {
    const pages = (data?.pages.filter(page => !("error" in page)) || []) as LedgerPage[];
    const lastPage = pages.at(-1);

    return [
      pages.flatMap(page => page.rows) ?? [],
      lastPage?.minNet ?? 0,
      lastPage?.maxNet ?? 0,
      lastPage?.medianNet ?? 0
    ];
  }
    , [data]
  );
  const itemContent = useMemo(() => rowContent(minNet, maxNet, medianNet), [minNet, maxNet, medianNet]);
  return <Paper style={{ height: 400, width: '100%' }}>
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

