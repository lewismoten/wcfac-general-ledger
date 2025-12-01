export const drillDownLevels = [
  'fy',
  're',
  'ol1',
  'ol1Func',
  'ol2',
  'dept',
  'acct',
  'vend',
  'po',
  'inv1',
  'inv2',
  'inv3',
  'inv'
];

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

export const formatCurrency = (value: any) => value.toLocaleString("en-US", {
  style: "currency",
  currency: "USD", maximumFractionDigits: 2
});

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