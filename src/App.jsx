import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';

import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Clients from '@/pages/Clients';
import Loans from '@/pages/Loans';
import NewLoan from '@/pages/NewLoan';
import LoanDetail from '@/pages/LoanDetail';
import Payments from '@/pages/Payments';
import Reports from '@/pages/Reports';
import Alerts from '@/pages/Alerts';
import Caja from '@/pages/Caja';

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/Dashboard" replace />} />
            <Route path="/Dashboard" element={<Dashboard />} />
            <Route path="/Clients" element={<Clients />} />
            <Route path="/Loans" element={<Loans />} />
            <Route path="/NewLoan" element={<NewLoan />} />
            <Route path="/LoanDetail" element={<LoanDetail />} />
            <Route path="/Payments" element={<Payments />} />
            <Route path="/Reports" element={<Reports />} />
            <Route path="/Alerts" element={<Alerts />} />
            <Route path="/Caja" element={<Caja />} />
          </Route>
          <Route path="*" element={<PageNotFound />} />
        </Routes>
        <Toaster />
      </Router>
    </QueryClientProvider>
  )
}

export default App