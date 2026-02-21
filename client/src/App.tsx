import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute, AdminRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import MissionsPage from "@/pages/missions";
import MissionNewPage from "@/pages/mission-new";
import MissionDetailPage from "@/pages/mission-detail";
import MissionEditPage from "@/pages/mission-edit";
import MissionRapportPage from "@/pages/mission-rapport";
import TemplatesPage from "@/pages/templates";
import ExtractionsPage from "@/pages/extractions";
import SettingsPage from "@/pages/settings";
import AuthPage from "@/pages/auth-page";
import EmployeesPage from "@/pages/employees";
import CalendrierPage from "@/pages/calendrier";

function SalarieHome() {
  return <Redirect to="/missions" />;
}

function Router() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <Switch>
      <Route path="/">
        {isAdmin ? <Dashboard /> : <SalarieHome />}
      </Route>
      <Route path="/missions" component={MissionsPage} />
      <Route path="/missions/new">
        <AdminRoute><MissionNewPage /></AdminRoute>
      </Route>
      <Route path="/missions/:id" component={MissionDetailPage} />
      <Route path="/missions/:id/edit">
        <AdminRoute><MissionEditPage /></AdminRoute>
      </Route>
      <Route path="/missions/:id/rapport" component={MissionRapportPage} />
      <Route path="/calendrier" component={CalendrierPage} />
      <Route path="/extractions">
        <AdminRoute><ExtractionsPage /></AdminRoute>
      </Route>
      <Route path="/templates">
        <AdminRoute><TemplatesPage /></AdminRoute>
      </Route>
      <Route path="/settings">
        <AdminRoute><SettingsPage /></AdminRoute>
      </Route>
      <Route path="/employees">
        <AdminRoute><EmployeesPage /></AdminRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const { user, isLoading } = useAuth();

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  // Show login page when not authenticated
  if (!isLoading && !user) {
    return (
      <Switch>
        <Route path="/login" component={AuthPage} />
        <Route>
          <AuthPage />
        </Route>
      </Switch>
    );
  }

  return (
    <ProtectedRoute>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <header className="flex h-14 items-center justify-between gap-4 border-b px-4 shrink-0 bg-gradient-to-r from-transparent via-transparent to-blue-50/50 dark:to-blue-950/20">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <ThemeToggle />
            </header>
            <main className="flex-1 overflow-auto bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-950/30 dark:to-background">
              <Router />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="crm-theme">
        <TooltipProvider>
          <AuthProvider>
            <AppLayout />
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
