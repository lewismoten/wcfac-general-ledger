import { useMemo, forwardRef } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { TableVirtuoso, type TableComponents } from 'react-virtuoso';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

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

interface ColumnData {
  dataKey: keyof Data;
  label: string;
  tip: string,
  numeric?: boolean;
  width?: number;
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
function rowContent(_index: number, row: Data) {
  return (
    <>
      {columns.map((column) => (
        <TableCell
          sx={{ fontSize: 'smaller', fontFamily: 'monospace', padding: '2px' }}
          key={column.dataKey}
          align={column.numeric || false ? 'right' : 'left'}
        >
          {row[column.dataKey]}
        </TableCell>
      ))}
    </>
  );
}
export const LedgerTable = ({ searchParams = "" }: { searchParams: string }) => {
  const localParams = useMemo(() => {
    const params = new URLSearchParams(searchParams);
    if (params.has('series')) params.delete('series');
    if (params.has('pg')) params.delete('pg');
    if (params.has('ps')) params.delete('ps');
    return params.toString();
  }, [searchParams]);
  const { data } = useQuery<Data[]>({
    queryKey: ['legerData', localParams],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await fetch(`/api/ledger.php?${localParams}`);
      return res.json();
    }
  });
  return <Paper style={{ height: 400, width: '100%' }}>
    <TableVirtuoso
      data={data ?? []}
      components={VirtuosoTableComponents}
      fixedHeaderContent={fixedHeaderContent}
      itemContent={rowContent}
    />
  </Paper>
}

