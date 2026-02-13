SELECT
  ROUND(SUM(POW (v.pct, 2)), 2) AS hhi,
  COUNT(*) AS vendor_count,
  t.total_outflow_cents,
  ROUND(MAX(v.pct), 2) AS top_vendor_pct
FROM
  (
    SELECT
      l.VENDOR_ID,
      (
        (SUM(l.NET_AMOUNT) / NULLIF(t.total_outflow, 0)) * 100
      ) AS pct
    FROM
      LEDGER l
      CROSS JOIN (
        SELECT
          SUM(l2.NET_AMOUNT) AS total_outflow,
          CAST(SUM(l2.NET_AMOUNT) * 100 AS SIGNED) AS total_outflow_cents
        FROM
          LEDGER l2
        WHERE
          l2.ACCOUNT_RE = 4
          AND l2.CHECK_DATE >= ?
          AND l2.CHECK_DATE < ?
          AND l2.NET_AMOUNT > 0
      ) t
    WHERE
      l.ACCOUNT_RE = 4
      AND l.CHECK_DATE >= ?
      AND l.CHECK_DATE < ?
      AND l.NET_AMOUNT > 0
    GROUP BY
      l.VENDOR_ID
  ) v
  CROSS JOIN (
    SELECT
      CAST(SUM(l.NET_AMOUNT) * 100 AS SIGNED) AS total_outflow_cents
    FROM
      LEDGER l
    WHERE
      l.ACCOUNT_RE = 4
      AND l.CHECK_DATE >= ?
      AND l.CHECK_DATE < ?
      AND l.NET_AMOUNT > 0
  ) t;