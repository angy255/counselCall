import "./globals.css";
import type { Metadata } from "next";
import { Navbar } from "../components/Navbar";
import { AuthProvider } from "../lib/auth-context";

export const metadata: Metadata = {
  title: "CounselCall",
  description: "Book and manage attorney consultations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
