import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppShell } from "./components/layout/AppShell";
import Dashboard from "./pages/Dashboard";
import Areas from "./pages/Areas";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import TagPrint from "./pages/TagPrint";
import CertificateBuilder from "./pages/CertificateBuilder";
import SingleTagPrint from "./pages/SingleTagPrint";
import ProjectCertificates from "./pages/ProjectCertificates";
import TagDesignerSettings from "./pages/TagDesignerSettings";
import AccessControl from "./pages/AccessControl";
import UserManagement from "./pages/UserManagement";
import { AdminRouteGate } from "./components/security/AdminRouteGate";
import BlindDetails from "./pages/BlindDetails";
import SlipBlinds from "./pages/SlipBlinds";
import ApprovalCenter from "./pages/ApprovalCenter";
import NotificationInbox from "./pages/NotificationInbox";
import AuditTrail from "./pages/AuditTrail";
import ReportsExportCenter from "./pages/ReportsExportCenter";
import SystemSettingsCenter from "./pages/SystemSettingsCenter";
import WorkflowStudio from "./pages/WorkflowStudio";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import RegisterUser from "./pages/RegisterUser";
import UserProfile from "./pages/UserProfile";
import { readAuthSession } from "@/lib/auth";
import { Route, Switch, useLocation } from "wouter";
import { useEffect, useState, type ReactNode } from "react";


function AuthGate({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [session, setSession] = useState(() => readAuthSession());

  useEffect(() => {
    const handler = () => setSession(readAuthSession());
    window.addEventListener("sbts-auth-session-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("sbts-auth-session-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  useEffect(() => {
    if (!session.authenticated && location !== "/login" && location !== "/register") setLocation("/login");
    if (session.authenticated && location === "/login") setLocation("/dashboard");
  }, [location, session.authenticated, setLocation]);

  if (!session.authenticated && location !== "/login" && location !== "/register") return null;
  return <>{children}</>;
}

function Router() {
  const [location] = useLocation();
  if (location === "/login") {
    return <Login />;
  }
  if (location === "/register") {
    return <RegisterUser />;
  }
  return (
    <AuthGate>
      <AppShell>
        <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/areas" component={Areas} />
        <Route path="/projects/:id/tag-settings" component={TagDesignerSettings} />
        <Route path="/projects/:id/tags" component={TagPrint} />
        <Route path="/projects/:id/certificates" component={ProjectCertificates} />
        <Route path="/projects/:id" component={ProjectDetails} />
        <Route path="/projects" component={Projects} />
        <Route path="/blinds/:id/certificate" component={CertificateBuilder} />
        <Route path="/blinds/:id/tag" component={SingleTagPrint} />
        <Route path="/blinds/:id" component={BlindDetails} />
        <Route path="/slip-blinds" component={SlipBlinds} />
        <Route path="/approvals" component={ApprovalCenter} />
        <Route path="/inbox" component={NotificationInbox} />
        <Route path="/profile" component={UserProfile} />
        <Route path="/audit">{() => <AdminRouteGate title="Audit Trail is admin locked"><AuditTrail /></AdminRouteGate>}</Route>
        <Route path="/reports" component={ReportsExportCenter} />
        <Route path="/settings">{() => <AdminRouteGate title="System Settings are admin locked"><SystemSettingsCenter /></AdminRouteGate>}</Route>
        <Route path="/workflow-studio">{() => <AdminRouteGate title="Workflow Studio is admin locked"><WorkflowStudio /></AdminRouteGate>}</Route>
        <Route path="/users">{() => <AdminRouteGate title="User Management is admin locked"><UserManagement /></AdminRouteGate>}</Route>
        <Route path="/access-control">{() => <AdminRouteGate title="Access Control is admin locked"><AccessControl /></AdminRouteGate>}</Route>
          <Route component={NotFound} />
        </Switch>
      </AppShell>
    </AuthGate>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
