import { Switch, Route, Router as WouterRouter } from "wouter";
import { setBaseUrl } from "@workspace/api-client-react";
import "./lib/i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/context/AuthContext";
import Dashboard from "@/pages/Dashboard";
import JobsDirectory from "@/pages/JobsDirectory";
import JobDetails from "@/pages/JobDetails";
import JobApplications from "@/pages/JobApplications";
import ApplicationTracker from "@/pages/ApplicationTracker";
import PgCetHub from "@/pages/PgCetHub";
import PgCetResultFinder from "@/pages/PgCetResultFinder";
import LoginPage from "@/pages/LoginPage";
import ApplyPage from "@/pages/ApplyPage";
import PgCetApplyPage from "@/pages/PgCetApplyPage";
import AdminPanel from "@/pages/AdminPanel";
import Profile from "@/pages/Profile";
import JobAlerts from "@/pages/JobAlerts";
import AnalyticsDashboard from "@/pages/AnalyticsDashboard";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 5 * 60 * 1000 }
  }
});

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route>
        <AppLayout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/jobs" component={JobsDirectory} />
            <Route path="/jobs/:id/applications" component={JobApplications} />
            <Route path="/jobs/:id" component={JobDetails} />
            <Route path="/jobs/:id/apply" component={ApplyPage} />
            <Route path="/applications" component={ApplicationTracker} />
            <Route path="/job-alerts" component={JobAlerts} />
            <Route path="/exams" component={PgCetHub} />
            <Route path="/exams/:id/apply" component={PgCetApplyPage} />
            <Route path="/exams/result-finder" component={PgCetResultFinder} />
            <Route path="/admin" component={AdminPanel} />
            <Route path="/admin/analytics" component={AnalyticsDashboard} />
            <Route path="/profile" component={Profile} />
            <Route component={NotFound} />
          </Switch>
        </AppLayout>
      </Route>
    </Switch>
  );
}

const apiUrl = import.meta.env.VITE_API_URL;
if (apiUrl) {
  setBaseUrl(apiUrl);
}

function App() {
  console.log("App initializing...", {
    BASE_URL: import.meta.env.BASE_URL,
    VITE_API_URL: apiUrl,
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    SUPABASE_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? "EXISTS" : "MISSING"
  });
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
              <Router />
            </WouterRouter>
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
