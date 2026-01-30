import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./locales"; // Initialize i18n
import { initializeTheme } from "./hooks/useTheme";

// Initialize theme before React renders to prevent flash
initializeTheme();

createRoot(document.getElementById("root")!).render(<App />);
