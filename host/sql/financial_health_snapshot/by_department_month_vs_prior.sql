SELECT
  COA_DEPT.ID,
  COA_DEPT.Name,
  CAST(
    SUM(
      CASE
        WHEN LEDGER.ACCOUNT_PAID >= ?
        AND LEDGER.ACCOUNT_PAID < ? THEN LEDGER.NET_AMOUNT
        ELSE 0
      END
    ) * 100 AS SIGNED
  ) AS current_net_cents,
  CAST(
    SUM(
      CASE
        WHEN LEDGER.ACCOUNT_PAID >= ?
        AND LEDGER.ACCOUNT_PAID < ?
        AND LEDGER.NET_AMOUNT > 0 THEN LEDGER.NET_AMOUNT
        ELSE 0
      END
    ) * 100 AS SIGNED
  ) AS current_outflow_cents,
  CAST(
    SUM(
      CASE
        WHEN LEDGER.ACCOUNT_PAID >= ?
        AND LEDGER.ACCOUNT_PAID < ? THEN LEDGER.NET_AMOUNT
        ELSE 0
      END
    ) * 100 AS SIGNED
  ) AS prior_net_cents,
  CAST(
    SUM(
      CASE
        WHEN LEDGER.ACCOUNT_PAID >= ?
        AND LEDGER.ACCOUNT_PAID < ?
        AND LEDGER.NET_AMOUNT > 0 THEN LEDGER.NET_AMOUNT
        ELSE 0
      END
    ) * 100 AS SIGNED
  ) AS prior_outflow_cents
FROM
  LEDGER
  INNER JOIN COA_DEPT ON LEDGER.ACCOUNT_DEPT = COA_DEPT.ID
WHERE
  LEDGER.ACCOUNT_RE = 4
  AND (
    (
      LEDGER.ACCOUNT_PAID >= ?
      AND LEDGER.ACCOUNT_PAID < ?
    )
    OR (
      LEDGER.ACCOUNT_PAID >= ?
      AND LEDGER.ACCOUNT_PAID < ?
    )
  )
GROUP BY
  COA_DEPT.ID,
  COA_DEPT.Name
ORDER BY
  current_outflow_cents DESC