import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StagewiseToolbar } from "@stagewise/toolbar-react";
import ReactPlugin from "@stagewise-plugins/react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import AboutUs from "./pages/AboutUs";
import Programs from "./pages/Programs";
import Schools from "./pages/Schools";
import FAQ from "./pages/FAQ";
import Parents from "./pages/Parents";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import RefundPolicy from "./pages/RefundPolicy";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import DailyStreak from "./pages/DailyStreak";
import Quiz from "./pages/Quiz";
import Webinars from "./pages/Webinars";
import Workshops from "./pages/Workshops";
import Leaderboard from "./pages/Leaderboard";
import Reports from "./pages/Reports";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <StagewiseToolbar config={{ plugins: [ReactPlugin] }} />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/daily-streak" element={<DailyStreak />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/webinars" element={<Webinars />} />
          <Route path="/workshops" element={<Workshops />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/schools" element={<Schools />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/parents" element={<Parents />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsConditions />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
