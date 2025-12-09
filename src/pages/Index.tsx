import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";

const Index = () => {
  const navigate = useNavigate();
  const { user, hasCompletedOnboarding } = useApp();

  useEffect(() => {
    if (user && hasCompletedOnboarding) {
      navigate('/home');
    } else {
      navigate('/landing');
    }
  }, [user, hasCompletedOnboarding, navigate]);

  return null;
};

export default Index;
