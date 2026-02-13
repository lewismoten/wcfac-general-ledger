CREATE INDEX idx_ledger_checkdate_amount ON LEDGER (CHECK_DATE, NET_AMOUNT);
CREATE INDEX idx_ledger_vendor_checkdate ON LEDGER (VENDOR_ID, CHECK_DATE);
CREATE INDEX idx_ledger_dept_checkdate   ON LEDGER (ACCOUNT_DEPT, CHECK_DATE);
