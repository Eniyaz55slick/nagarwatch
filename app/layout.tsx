import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title:       "NagarWatch — Civic Accountability Platform",
  description: "AI-powered civic complaint management for Indian cities",
  icons:       { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#111827",
              color:      "#f8fafc",
              border:     "1px solid #1e293b",
              borderRadius: "10px",
              fontSize:   "13px",
            },
            success: { iconTheme: { primary: "#10b981", secondary: "#111827" } },
            error:   { iconTheme: { primary: "#ef4444", secondary: "#111827" } },
          }}
        />
      </body>
    </html>
  );
}
