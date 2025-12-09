import { useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ApiError } from './ApiError';
import { useSearchParams } from 'react-router-dom';
import { formatCurrency } from './utils';
import Grid from '@mui/material/Grid';

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
export const Vendor = ({report, dept, acct, vend}: {report: LedgerReport, dept: number, acct: number, vend: number}) => {
  const vendor = report.departments[dept].accounts[acct].vendors[vend];
  return <>
  <Grid size={2}>&nbsp;</Grid>
  <Grid size={1}>{vend.toString().padStart(6, '0')}</Grid>
  <Grid size={9-report.years.length}>{vendor.name}</Grid>
    {report.years.map(year => 
    <Grid key={year} size={1} textAlign="right">{ formatCurrency(vendor[year]) ?? <>&nbsp;</> }</Grid>)}    
  </>;
}
export const Account = ({report, dept, acct}: {report: LedgerReport, dept: number, acct: number}) => {
  const vendor_nos = Object.keys(report.departments[dept].accounts[acct].vendors).map(no => parseInt(no));
  return <>
  <Grid size={1}>&nbsp;</Grid>
  <Grid size={1}>{acct.toString().padStart(5, '0')}</Grid>
  <Grid size={10-report.years.length}>
    {report.departments[dept].accounts[acct].name}
  </Grid>
  {report.years.map(year => <Grid key={year} size={1}>&nbsp;</Grid>)}
{vendor_nos.map(vendor_no => <Vendor key={vendor_no} dept={dept} acct={acct} vend={vendor_no} report={report} />)}
  </>;
}
export const Department = ({report, no}: {report: LedgerReport, no: number}) => {
  const account_nos = Object.keys(report.departments[no].accounts).map(no => parseInt(no));
  return <>
  <Grid size={1}>{no.toString().padStart(6, '0')}</Grid>
  <Grid size={11-report.years.length}>{report.departments[no].name}</Grid>
  {report.years.map(year => <Grid key={year} size={1}>&nbsp;</Grid>)}
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

  return <Grid container spacing={1} border={1}>
          <Grid size={12-data.years.length}>Description</Grid>
          {data.years.map(year => <Grid key={year} size={1}>{year}</Grid>)}
          <Departments report={data} />
          </Grid>

}

