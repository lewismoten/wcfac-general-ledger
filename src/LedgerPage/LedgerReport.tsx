import { useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ApiError } from './ApiError';
import { useSearchParams } from 'react-router-dom';
import { formatCurrency } from './utils';
import Grid from '@mui/material/Grid';
import { type SxProps } from '@mui/system';

interface LedgerReportVendor {
  no: number,
  name: string,
  [key:number]: number
}
interface LedgerReportAccount {
  no: number,
  name: string,
  vendors: {[key:number]: LedgerReportVendor}
}
interface LedgerReportDepartment {
  no: number,
  name: string,
  accounts: {[key:number]: LedgerReportAccount}
}
type LedgerReport = {
  years: number[],
  departments: {[key:number]: LedgerReportDepartment}
}

const YEAR_SIZE = 2;
export const Vendor = ({report, dept, acct, vend, index}: {report: LedgerReport, dept: number, acct: number, vend: number, index: number}) => {
  const vendor = report.departments[dept].accounts[acct].vendors[vend];
   const lineStyle: SxProps = {
    fontSize: '8pt',
    background: index % 2 === 0 ? '#ffffff' : '#f0f0f0'
  };
   const lineNumStyle: SxProps = {
    ...lineStyle,
    textAlign: 'center'
  };
  const sumStyle: SxProps = {...lineStyle, textAlign: 'right' };
    return <>
  <Grid size={2}>&nbsp;</Grid>
  <Grid size={1} sx={lineNumStyle}>{vend.toString().padStart(6, '0')}</Grid>
  <Grid size={9-(report.years.length*YEAR_SIZE)} sx={lineStyle}>{vendor.name}</Grid>
    {report.years.map(year => 
    <Grid key={year} size={YEAR_SIZE} sx={sumStyle}>{ formatCurrency(vendor[year]) ?? <>&nbsp;</> }</Grid>)}    
  </>;
}
export const Account = ({report, dept, acct}: {report: LedgerReport, dept: number, acct: number}) => {
  const account = report.departments[dept].accounts[acct];
  const vendors = account.vendors;
  const vendorNos = Object.keys(account.vendors).map(no => parseInt(no));
  const acctSums = report.years.map(year => 
      vendorNos.reduce((sum, vendorNo) => sum + (vendors[vendorNo][year] ?? 0), 0)
  );
   const accountStyle: SxProps = {
    backgroundColor: '#d0d0d0', 
    fontWeight: 'bold', 
    borderBottom: '1px solid black',
    fontSize: '10pt'
  };
   const accountNumStyle: SxProps = {
    ...accountStyle,
    borderLeft: '1px solid black',
    textAlign: 'center'
  };
  const sumStyle: SxProps = {...accountStyle, textAlign: 'right', borderLeft: undefined };
 return <>
  <Grid size={1}>&nbsp;</Grid>
  <Grid size={1} sx={accountNumStyle}>{acct.toString().padStart(5, '0')}</Grid>
  <Grid size={10-(report.years.length*YEAR_SIZE)} sx={accountStyle}>
    {report.departments[dept].accounts[acct].name}
  </Grid>
  {acctSums.map((sum, idx) => <Grid key={idx} size={YEAR_SIZE} sx={sumStyle}>{sum === 0 ? <>&nbsp;</> : formatCurrency(sum)}</Grid>)}
{vendorNos.map((vendorNo, idx) => <Vendor key={vendorNo} index={idx} dept={dept} acct={acct} vend={vendorNo} report={report} />)}
  </>;
}
export const Department = ({report, no}: {report: LedgerReport, no: number}) => {
  const department = report.departments[no];
  const account_nos = Object.keys(department.accounts).map(no => parseInt(no));
  const deptSums = report.years.map(year => 
    account_nos.reduce((deptSum, acct) => {
      const vendors = department.accounts[acct].vendors;
      const vendorNos = Object.keys(vendors).map(key => parseInt(key));
      const vendorSum = vendorNos.reduce((sum, vendorNo) => sum + (vendors[vendorNo][year] ?? 0), 0);
      return deptSum + vendorSum;
    }, 0)
  );

  const deptStyle: SxProps = {
    backgroundColor: '#b0b0b0', 
    fontWeight: 'bold', 
    borderTop: '1px solid black', 
    borderBottom: '1px solid black',
    fontSize: '12pt'
  };
  const deptNumStyle: SxProps = {
    ...deptStyle,
    borderLeft: '1px solid black', 
    textAlign: 'center'
  };
  const sumStyle: SxProps = {...deptStyle, textAlign: 'right' };
  return <>
  <Grid size={1} sx={deptNumStyle}>{no.toString().padStart(6, '0')}</Grid>
  <Grid size={11-(report.years.length*YEAR_SIZE)} sx={deptStyle}>{department.name}</Grid>
  {deptSums.map((sum, idx) => <Grid key={idx} sx={sumStyle} size={YEAR_SIZE}>{sum === 0 ? <>&nbsp;</> : formatCurrency(sum)}</Grid>)}
{account_nos.map(account_no => <Account key={account_no} dept={no} acct={account_no} report={report} />)}
  </>;
}
export const Departments = ({report}: {report: LedgerReport}) => {
  const department_nos = Object.keys(report.departments).map(no => parseInt(no));
  return department_nos.map(no => <Department key={no} no={no} report={report} />);
}
export const LedgerReport = () => {
  const [searchParams] = useSearchParams();

  const localParams = useMemo(() => {
    const params = new URLSearchParams(searchParams);
    ['series', 'pg', 'ps'].forEach(key => {
      if (params.has(key)) params.delete(key);
    });
    return params.toString();
  }, [searchParams]);

  const { data } = useQuery<LedgerReport | ApiError>({
    queryKey: ['ledger-report', localParams],
    placeholderData: keepPreviousData,
    enabled: true,
    queryFn: async () => {
      const res = await fetch(`/api/ledger-report.php?${localParams}`);
      return res.json();
    }
  });

  if(data === null || data === void 0) {
    return null;
  }
  if("error" in data) {
    return <p>{data.error}</p>
  }
  if(!("departments" in data) 
    || (Array.isArray(data.departments) && data.departments.length === 0) 
  || Object.keys(data.departments).length === 0
) {
    return <>No information to display.</>
  }

  return <Grid container spacing={0} border={1}>
          <Grid size={1}>Dept No.</Grid>
          <Grid size={1}>Acct No.</Grid>
          <Grid size={1}>Vend No.</Grid>
          <Grid size={9-(data.years.length*YEAR_SIZE)}>Vendor Name</Grid>
          {data.years.map(year => <Grid key={year} size={YEAR_SIZE} textAlign="right">{year}</Grid>)}
          <Departments report={data} />
          </Grid>
}

