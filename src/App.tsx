import { Routes, Route } from "react-router-dom";
import HomePage from "./LedgerPage/LegerPage";
import LedgerPage from "./LedgerPage/LegerPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/ledger" element={<LedgerPage />} />
    </Routes>
  );
}