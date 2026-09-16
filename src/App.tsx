import { useState } from "react";
import { HashRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AddMenu } from "@/components/AddMenu";
import { InstallHint } from "@/components/InstallHint";
import { TabBar } from "@/components/TabBar";
import { BarcodeScanScreen } from "@/screens/BarcodeScan";
import { EditEntryScreen } from "@/screens/EditEntry";
import { LogFoodScreen } from "@/screens/LogFood";
import { MoreScreen } from "@/screens/More";
import { OnboardingScreen } from "@/screens/Onboarding";
import { PlanScreen } from "@/screens/Plan";
import { ProgressScreen } from "@/screens/Progress";
import { TodayScreen } from "@/screens/Today";
import { DiaryProvider } from "@/providers/DiaryProvider";
import { ProfileProvider, useProfile } from "@/providers/ProfileProvider";
import { ToastProvider } from "@/providers/ToastProvider";

/** The four tabbed screens share the bottom bar and the add menu. */
function TabLayout() {
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <Outlet />
      </div>
      <InstallHint />
      <TabBar onAddPress={() => setAddMenuOpen(true)} />
      <AddMenu open={addMenuOpen} onClose={() => setAddMenuOpen(false)} />
    </div>
  );
}

function AppRoutes() {
  const { profile } = useProfile();

  if (!profile.onboarded) {
    return <OnboardingScreen />;
  }

  return (
    <Routes>
      <Route element={<TabLayout />}>
        <Route path="/" element={<TodayScreen />} />
        <Route path="/plan" element={<PlanScreen />} />
        <Route path="/progress" element={<ProgressScreen />} />
        <Route path="/more" element={<MoreScreen />} />
      </Route>
      <Route path="/log-food" element={<LogFoodScreen />} />
      <Route path="/edit-entry" element={<EditEntryScreen />} />
      <Route path="/barcode-scan" element={<BarcodeScanScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    // HashRouter keeps the app working on any host — GitHub Pages sub-paths and
    // static hosts without SPA rewrites included.
    <HashRouter>
      <ToastProvider>
        <ProfileProvider>
          <DiaryProvider>
            <div className="app-shell">
              <AppRoutes />
            </div>
          </DiaryProvider>
        </ProfileProvider>
      </ToastProvider>
    </HashRouter>
  );
}
