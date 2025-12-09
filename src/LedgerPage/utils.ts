interface Level {
  field: string;
  name: string;
}

export const levels: Level[] = [
  {field: 'fy', name: 'Fiscal Year'},
  {field: 'bat', name: 'Batch'},
  {field: 're', name: 'Revenue/Expenditure'},
  {field: 'ol1', name: 'Object Level 1'},
  {field: 'ol1Func', name: 'Function'},
  {field: 'ol2', name: 'Object Level 2'},
  {field: 'dept', name: 'Department'},
  {field: 'acct', name: 'Account'},
  {field: 'vend', name: 'Vendor'},
  {field: 'po', name: 'Purchase Order'},
  {field: 'chk', name: 'Check'},
  {field: 'inv1', name: 'Invoice part 1'},
  {field: 'inv2', name: 'Invoice part 2'},
  {field: 'inv3', name: 'Invoice part 3'},
  {field: 'inv', name: 'Invoice'},
  {field: 'des', name: 'Description'}
];

export const drillDownLevels = levels.map(l => l.field);

export const colors = [
  "#3366CC",
  "#DC3912",
  "#FF9900",
  "#109618",
  "#990099",
  "#0099C6",
  "#DD4477",
  "#66AA00",
  "#B82E2E",
  "#316395",
  "#994499",
  "#22AA99",
  "#AAAA11",
  "#6633CC",
  "#E67300",
  "#8B0707",
  "#651067",
  "#329262",
  "#5574A6",
  "#3B3EAC"
];

export const formatCurrency = (value: any) => value ? value.toLocaleString("en-US", {
  style: "currency",
  currency: "USD", maximumFractionDigits: 2
}) : void 0;

export const formatCurrencyAsUnit = (value: any): string => {

  let multiplier = 1;
  let unit = '';
  let maximumFractionDigits = 2;
  let absValue = Math.abs(value);

  if (absValue >= 1000000) {
    multiplier = 0.000001;
    unit = 'M';
    if (absValue > 10000000) {
      maximumFractionDigits = 0;
    } else {
      maximumFractionDigits = 1;
    }
  } else if (absValue >= 1000) {
    multiplier = 0.001;
    unit = 'K';
    if (absValue > 10000) {
      maximumFractionDigits = 0;
    } else {
      maximumFractionDigits = 1;
    }
  }

  let text = (value * multiplier).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits,
  });
  // remove .0 and .00 suffix
  return text.replace(/\.0+$/, '') + unit
};

export const interpolateColor = (color1: string, color2: string, percent: number) => {
  const c1 = parseInt(color1.slice(1), 16);
  const c2 = parseInt(color2.slice(1), 16);

  const r = c1 >> 16;
  const g = (c1 >> 8) & 0xff;
  const b = c1 & 0xff;

  const r2 = c2 >> 16;
  const g2 = (c2 >> 8) & 0xff;
  const b2 = c2 & 0xff;

  if (percent > 1) percent = 1;
  if (percent < 0) percent = 0;

  const nr = Math.round(r + (r2 - r) * percent);
  const ng = Math.round(g + (g2 - g) * percent);
  const nb = Math.round(b + (b2 - b) * percent);

  return `#${((1 << 24) + (nr << 16) + (ng << 8) + nb).toString(16).slice(1)}`;
};