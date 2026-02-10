SELECT
  CAST(
    SUM(
      CASE
        WHEN CHECK_DATE >= ?
        AND CHECK_DATE < ? THEN NET_AMOUNT
        ELSE 0
      END
    ) * 100 AS SIGNED
  ) AS current_month_net_cents,
  CAST(
    SUM(
      CASE
        WHEN CHECK_DATE >= ?
        AND CHECK_DATE < ?
        AND NET_AMOUNT > 0 THEN NET_AMOUNT
        ELSE 0
      END
    ) * 100 AS SIGNED
  ) AS current_month_outflow_cents,
  CAST(
    SUM(
      CASE
        WHEN CHECK_DATE >= ?
        AND CHECK_DATE < ? THEN NET_AMOUNT
        ELSE 0
      END
    ) * 100 AS SIGNED
  ) AS fytd_net_cents,
  CAST(
    SUM(
      CASE
        WHEN CHECK_DATE >= ?
        AND CHECK_DATE < ?
        AND NET_AMOUNT > 0 THEN NET_AMOUNT
        ELSE 0
      END
    ) * 100 AS SIGNED
  ) AS fytd_outflow_cents,
  CAST(
    SUM(
      CASE
        WHEN CHECK_DATE >= ?
        AND CHECK_DATE < ? THEN NET_AMOUNT
        ELSE 0
      END
    ) * 100 AS SIGNED
  ) AS prior_year_month_net_cents,
  CAST(
    SUM(
      CASE
        WHEN CHECK_DATE >= ?
        AND CHECK_DATE < ?
        AND NET_AMOUNT > 0 THEN NET_AMOUNT
        ELSE 0
      END
    ) * 100 AS SIGNED
  ) AS prior_year_month_outflow_cents,
  CAST(
    SUM(
      CASE
        WHEN CHECK_DATE >= ?
        AND CHECK_DATE < ? THEN NET_AMOUNT
        ELSE 0
      END
    ) * 100 AS SIGNED
  ) AS prior_fytd_net_cents,
  CAST(
    SUM(
      CASE
        WHEN CHECK_DATE >= ?
        AND CHECK_DATE < ?
        AND NET_AMOUNT > 0 THEN NET_AMOUNT
        ELSE 0
      END
    ) * 100 AS SIGNED
  ) AS prior_fytd_outflow_cents
FROM
  LEDGER
WHERE
  ACCOUNT_RE = 4
  AND CHECK_DATE >= ?
  AND CHECK_DATE < ?