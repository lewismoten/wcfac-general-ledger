import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { currentFiscalMonth, currentFiscalYear } from "./fiscal";

export const useEnsureFiscalParams = (fyKey = "fy", fmKey = "fm") => {
  const [params, setParams] = useSearchParams();
  const now = useMemo(() => new Date(), []);

  useEffect(() => {
    const fy = params.get(fyKey);
    const fm = params.get(fmKey);

    if (fy && fm) return;

    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (!fy) next.set(fyKey, String(currentFiscalYear(now)));
      if (!fm) next.set(fmKey, String(currentFiscalMonth(now)));
      return next;
    });
  }, [params, setParams, fyKey, fmKey, now]);
};
