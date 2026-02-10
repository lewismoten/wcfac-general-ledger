const NA = "—";

export const formatPercentDelta = (current: number, prior: number): string => {
  if(prior === 0 && current === 0) return NA;
  if (prior === 0) return current === 0 ? "0.0%" : NA;
  return `${(((current - prior) / prior) * 100).toFixed(1)}%`;
};