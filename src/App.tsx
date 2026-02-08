import { Routes, Route } from "react-router-dom";
import {LedgerPage} from "./LedgerPage/LedgerPage";
import { FinancialHealthSnapshot } from './FinancialHealthSnapshot/FinancialHealthSnapshot';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LedgerPage />} />
      <Route path="/ledger" element={<LedgerPage />} />
      <Route path="/financial-health-snapshot" element={<FinancialHealthSnapshot />} />
    </Routes>
  );
}