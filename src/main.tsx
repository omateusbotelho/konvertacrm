import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply dark mode by default on initial load
const storedTheme = localStorage.getItem('konvertaos-theme');
if (!storedTheme || storedTheme === 'dark') {
  document.documentElement.classList.add('dark');
}

createRoot(document.getElementById("root")!).render(<App />);
