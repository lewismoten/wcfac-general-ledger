export const currentFiscalYear = (d: Date): number =>
  d.getMonth() >= 6 ? d.getFullYear() + 1 : d.getFullYear();

// Fiscal month 1..12 where 1=July
export const currentFiscalMonth = (d: Date): number =>
  ((d.getMonth() + 6) % 12) + 1;

// Fiscal month 1..12 -> calendar month 1..12
export const calendarMonthFromFiscal = (fm: number): number =>
  ((fm + 5) % 12) + 1;
