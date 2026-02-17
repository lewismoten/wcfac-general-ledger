SELECT
  v.vendor_id,
  v.vendor,
  v.fytd_outflow_cents,
  ROUND(
    v.fytd_outflow_cents / NULLIF(t.total_outflow_cents, 0) * 100,
    2
  ) AS pct_of_total
FROM
  (
    SELECT
      ven.ID AS vendor_id,
      ven.Name AS vendor,
      CAST(SUM(l.NET_AMOUNT) * 100 AS SIGNED) AS fytd_outflow_cents
    FROM
      LEDGER l
      INNER JOIN VENDOR ven ON ven.ID = l.VENDOR_ID
    WHERE
      l.ACCOUNT_RE = 4
      AND l.ACCOUNT_PAID >= ?
      AND l.ACCOUNT_PAID < ?
      AND l.NET_AMOUNT > 0
    GROUP BY
      ven.ID,
      ven.Name
    ORDER BY
      fytd_outflow_cents DESC
    LIMIT
      10
  ) v
  CROSS JOIN (
    SELECT
      CAST(SUM(l.NET_AMOUNT) * 100 AS SIGNED) AS total_outflow_cents
    FROM
      LEDGER l
    WHERE
      l.ACCOUNT_RE = 4
      AND l.ACCOUNT_PAID >= ?
      AND l.ACCOUNT_PAID < ?
      AND l.NET_AMOUNT > 0
  ) t
ORDER BY
  v.fytd_outflow_cents DESC;