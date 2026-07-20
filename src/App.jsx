import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Splash from './components/Splash';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import RfqPage from './pages/RfqPage';
import PocPage from './pages/PocPage';
import PocDetailPage from './pages/PocDetailPage';
import NpdPage from './pages/NpdPage';
import NpdDetailPage from './pages/NpdDetailPage';
import BomPage from './pages/BomPage';
import LinePage from './pages/LinePage';
import SamplePage from './pages/SamplePage';
import ReviewPage from './pages/ReviewPage';
import PendingPage from './pages/PendingPage';
import PpapPage from './pages/PpapPage';
import AskAiPage from './pages/AskAiPage';
import TrialPage from './pages/TrialPage';
import TrialDetailPage from './pages/TrialDetailPage';
import EcnPage from './pages/EcnPage';
import InvestmentPage from './pages/InvestmentPage';
import BudgetPage from './pages/BudgetPage';
import ResourcesPage from './pages/ResourcesPage';
import StandardsPage from './pages/StandardsPage';
import UsersPage from './pages/UsersPage';

export default function App() {
  const { user } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  const splash = showSplash && <Splash onDone={() => setShowSplash(false)} />;

  if (!user) {
    return (
      <>
        {splash}
        <Routes>
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </>
    );
  }

  return (
    <>
      {splash}
      <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/rfq" element={<RfqPage />} />
        <Route path="/poc" element={<PocPage />} />
        <Route path="/poc/:id" element={<PocDetailPage />} />
        <Route path="/npd" element={<NpdPage />} />
        <Route path="/npd/:id" element={<NpdDetailPage />} />
        <Route path="/bom" element={<BomPage />} />
        <Route path="/line" element={<LinePage />} />
        <Route path="/samples" element={<SamplePage />} />
        <Route path="/reviews" element={<ReviewPage />} />
        <Route path="/pending" element={<PendingPage />} />
        <Route path="/ppap" element={<PpapPage />} />
        <Route path="/ai" element={<AskAiPage />} />
        <Route path="/trials" element={<TrialPage />} />
        <Route path="/trials/:id" element={<TrialDetailPage />} />
        <Route path="/ecn" element={<EcnPage />} />
        <Route path="/investment" element={<InvestmentPage />} />
        <Route path="/budget" element={<BudgetPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/standards" element={<StandardsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      </Routes>
    </>
  );
}
