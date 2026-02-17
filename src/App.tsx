import { LedgerPage } from "./LedgerPage/LedgerPage";
import { FinancialHealthSnapshot } from './FinancialHealthSnapshot/FinancialHealthSnapshot';
import { AppBar, Toolbar, Tabs, Tab, Box, Typography } from '@mui/material';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { DepartmentFunctionSummary } from "./DepartmentFunctionSummary/DepartmentFunctionSummary";
import { VendorConcentrationLargePayments } from "./VendorConcentrationLargePayments/VendorConcentrationLargePayments";

export default function App() {
  const location = useLocation();

  const tabPaths = [
    "/ledger",
    "/financial-health-snapshot",
    "/department-function-summary",
    "/vendor-concentration-large-payments",
  ];

  const currentTab = (() => {
    const p = location.pathname === "/" ? "/ledger" : location.pathname;
    const idx = tabPaths.findIndex((x) => p.startsWith(x));
    return idx === -1 ? 0 : idx;
  })();

  return (
    <Box sx={{ 
      flexGrow: 1,
      "@media print": {
          p: 0,
        }
      }}>
      <AppBar position="static" color="default" elevation={1} sx={{
        '@media print': {
          display: 'none'
        }
      }}>
        <Toolbar variant="dense">
          <Typography variant="h6" sx={{ mr: 4, fontWeight: 'bold' }}>
            Audit / Finance Oversight
          </Typography>
          <Tabs value={currentTab} indicatorColor="primary" textColor="primary">
            <Tab
              label="Ledger"
              component={Link}
              to="/ledger"
            />
            <Tab
              label="Financial Health"
              component={Link}
              to="/financial-health-snapshot"
            />
            <Tab
              label="Departments"
              component={Link}
              to="/department-function-summary"
            />
            <Tab
              label="Vendors"
              component={Link}
              to="/vendor-concentration-large-payments"
            />
          </Tabs>
        </Toolbar>
      </AppBar>

      <Box sx={{ 
        p: 3,
        "@media print": {
          p: 0,
        },
       }}>
        <Routes>
          <Route path="/" element={<LedgerPage />} />
          <Route path="/ledger" element={<LedgerPage />} />
          <Route path="/financial-health-snapshot" element={<FinancialHealthSnapshot />} />
          <Route path="/department-function-summary" element={<DepartmentFunctionSummary />} />
          <Route path="/vendor-concentration-large-payments" element={<VendorConcentrationLargePayments />} />
        </Routes>
      </Box>
    </Box>
  );
}