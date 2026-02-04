import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Validate environment variables on startup
// This will throw an error if required variables are missing
import "./lib/env";

// Apply dark mode by default on initial load
const storedTheme = localStorage.getItem('konvertaos-theme');
if (!storedTheme || storedTheme === 'dark') {
  document.documentElement.classList.add('dark');
}

createRoot(document.getElementById("root")!).render(<App />);
