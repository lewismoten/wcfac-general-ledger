export const drillDownLevels = [
  'fy',
  're',
  'ol1',
  'ol1Func',
  'ol2',
  'dept',
  'acct',
  'vend',
  'inv1',
  'inv2',
  'inv3',
  'inv'
];

export const formatBigDollarValue = (value: any): string => {

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