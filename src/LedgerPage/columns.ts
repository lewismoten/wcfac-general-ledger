import type { ColumnData } from "./ColumnData";

export const columns: ColumnData[] = [
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