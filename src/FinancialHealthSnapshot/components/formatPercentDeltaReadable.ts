export const formatPercentDeltaReadable = (
  current: number,
  prior: number
): string => {
  if (prior === 0) {
    return current === 0 ? "0%" : "New spending";
  }

  
  const pct = ((current - prior) / prior) * 100;
  const abs = Math.abs(pct);

  if (abs >= 1000) {

    if (Math.abs(prior) < 100_000) {
      return "Low prior baseline";
    }

    return pct > 0 ? "> +1,000%" : "< -1,000%";
  }

  return `${pct.toFixed(1)}%`;
};