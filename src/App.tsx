import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { HelpButton } from "@/components/HelpButton";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";

// Pages
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Splash from "./pages/Splash";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Plans from "./pages/Plans";
import Chat from "./pages/Chat";
import Feedback from "./pages/Feedback";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Achievements from "./pages/Achievements";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";

// Dev/Admin Pages
import DevLogin from "./pages/dev/DevLogin";
import InvestorDashboard from "./pages/dev/InvestorDashboard";
import ProductDashboard from "./pages/dev/ProductDashboard";
import AcquisitionDashboard from "./pages/dev/AcquisitionDashboard";

const queryClient = new QueryClient();

// Pages where HelpButton should NOT appear
const noHelpButtonRoutes = ['/', '/landing', '/splash', '/auth', '/dev', '/dev/dashboard', '/dev/dashboard/product', '/dev/dashboard/acquisition'];

function AppRoutes() {
  const location = useLocation();
  // Hide on public pages, chat pages, and dev pages
  const isChatPage = location.pathname.startsWith('/chat/');
  const isDevPage = location.pathname.startsWith('/dev');
  const showHelpButton = !noHelpButtonRoutes.includes(location.pathname) && !isChatPage && !isDevPage;

  return (
    <>
      <main>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/splash" element={<Splash />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          
          {/* Protected routes - require auth + onboarding */}
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
          <Route path="/chat/:scenarioId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          
          {/* Admin/Dev routes */}
          <Route path="/dev" element={<DevLogin />} />
          <Route path="/dev/dashboard" element={<AdminRoute><InvestorDashboard /></AdminRoute>} />
          <Route path="/dev/dashboard/product" element={<AdminRoute><ProductDashboard /></AdminRoute>} />
          <Route path="/dev/dashboard/acquisition" element={<AdminRoute><AcquisitionDashboard /></AdminRoute>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {showHelpButton && <HelpButton />}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
