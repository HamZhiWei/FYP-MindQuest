import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import OverviewPage           from './pages/OverviewPage';
import IndicatorsPage         from './pages/IndicatorsPage';
import PSS10CorrelationPage   from './pages/PSS10CorrelationPage';
import FlaggedSessionsPage    from './pages/FlaggedSessionsPage';
import ScoringWeightsPage     from './pages/ScoringWeightsPage';
import TipsEditorPage         from './pages/TipsEditorPage';
import AuditLogPage           from './pages/AuditLogPage';
import ExportPage             from './pages/ExportPage';

// No login route — Keycloak handles auth before React renders (see main.tsx)
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/overview"          element={<OverviewPage />} />
        <Route path="/indicators"        element={<IndicatorsPage />} />
        <Route path="/pss10-correlation" element={<PSS10CorrelationPage />} />
        <Route path="/flagged"           element={<FlaggedSessionsPage />} />
        <Route path="/weights"           element={<ScoringWeightsPage />} />
        <Route path="/tips"              element={<TipsEditorPage />} />
        <Route path="/audit-log"         element={<AuditLogPage />} />
        <Route path="/export"            element={<ExportPage />} />
        <Route path="*"                  element={<Navigate to="/overview" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
