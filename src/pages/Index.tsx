import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Loader2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, hasCompletedOnboarding, isLoading, isProfileLoading } = useApp();

  useEffect(() => {
    // Wait for loading to complete before making any navigation decisions
    if (isLoading || isProfileLoading) return;

    if (isAuthenticated) {
      if (hasCompletedOnboarding) {
        navigate('/home', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    } else {
      navigate('/landing', { replace: true });
    }
  }, [isAuthenticated, hasCompletedOnboarding, isLoading, isProfileLoading, navigate]);

  // Show loading spinner while determining auth state
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
};

export default Index;
