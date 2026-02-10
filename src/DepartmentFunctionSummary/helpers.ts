
const centsToDollars = (cents: number) => cents / 100;

export const fmtMoney = (cents: number) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(centsToDollars(cents));

export const fmtDeltaMoney = (cents: number, unsigned: boolean = false) => {
  if (cents === 0) return "—";
  const sign = unsigned ? "" : (cents < 0 ? "-" : "+");
  return `${sign}${fmtMoney(Math.abs(cents))}`;
};

export const deltaColor = (cents: number) => {
  if (cents === 0) return "text.secondary";
  return cents < 0 ? "success.main" : "error.main";
};
export const formatMonthYear = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(d);
};

export const formatRange = (startIso: string, endExclusiveIso: string) =>
  `${formatMonthYear(startIso)} – ${formatMonthYear(
    // inclusive month label: subtract 1 day
    new Date(new Date(`${endExclusiveIso}T00:00:00`).getTime() - 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)
  )}`;


export const baseOptions = [
  { label: "All bases", cents: 0 },
  { label: "Prior ≥ $1k", cents: 1000 * 100 },
  { label: "Prior ≥ $10k", cents: 10000 * 100 },
  { label: "Prior ≥ $100k", cents: 100000 * 100 },
] as const;
