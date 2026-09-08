import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { ActivityPage } from "./pages/ActivityPage";
import { HelpPage } from "./pages/HelpPage";
import { HomePage } from "./pages/HomePage";
import { NewObligationPage } from "./pages/NewObligationPage";
import { NewRoundPage } from "./pages/NewRoundPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ReviewPage } from "./pages/ReviewPage";
import { RoundDetailPage } from "./pages/RoundDetailPage";
import { RoundsPage } from "./pages/RoundsPage";
import { SettingsPage } from "./pages/SettingsPage";

function RouteFocus() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    window.setTimeout(() => document.getElementById("main-content")?.focus({ preventScroll: true }), 0);
  }, [location.pathname]);
  return null;
}

export function App() {
  return <AppLayout><RouteFocus /><Routes><Route path="/" element={<HomePage />} /><Route path="/rounds" element={<RoundsPage />} /><Route path="/rounds/new" element={<NewRoundPage />} /><Route path="/rounds/:roundId" element={<RoundDetailPage />} /><Route path="/rounds/:roundId/obligations/new" element={<NewObligationPage />} /><Route path="/rounds/:roundId/review" element={<ReviewPage />} /><Route path="/activity" element={<ActivityPage />} /><Route path="/settings" element={<SettingsPage />} /><Route path="/help" element={<HelpPage />} /><Route path="*" element={<NotFoundPage />} /></Routes></AppLayout>;
}
