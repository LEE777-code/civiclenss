import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { defineCustomElements as jeepSqlite } from "jeep-sqlite/loader";
import App from "./App.tsx";
import "./index.css";
import { ClerkProvider } from "@clerk/clerk-react";
import { ThemeProvider } from "./hooks/use-theme";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
    throw new Error("Missing Clerk Publishable Key");
}

// Web-specific SQLite setup
if (Capacitor.getPlatform() === "web") {
    jeepSqlite(window);
    const jeepEl = document.createElement("jeep-sqlite");
    document.body.appendChild(jeepEl);
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
            <ThemeProvider>
                <App />
            </ThemeProvider>
        </ClerkProvider>
    </StrictMode>
);

