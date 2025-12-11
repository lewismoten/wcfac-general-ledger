import { Routes, Route } from "react-router-dom";
import {LedgerPage} from "./LedgerPage/LedgerPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LedgerPage />} />
      <Route path="/ledger" element={<LedgerPage />} />
    </Routes>
  );
}