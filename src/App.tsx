import { LedgerPage } from "./LedgerPage/LedgerPage";
import { FinancialHealthSnapshot } from './FinancialHealthSnapshot/FinancialHealthSnapshot';
import { AppBar, Toolbar, Tabs, Tab, Box, Typography } from '@mui/material';
import { Routes, Route, Link, useLocation } from 'react-router-dom';

export default function App() {
  const location = useLocation();
  const currentTab = location.pathname === '/financial-health-snapshot' ? 1 : 0;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="default" elevation={1}>
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
          </Tabs>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Routes>
          <Route path="/" element={<LedgerPage />} />
          <Route path="/ledger" element={<LedgerPage />} />
          <Route path="/financial-health-snapshot" element={<FinancialHealthSnapshot />} />
        </Routes>
      </Box>
    </Box>
  );
}