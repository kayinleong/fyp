import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./highlight.css"; // Add this line
import Header from "@/components/header";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/contexts/auth-context";
import ChatWidget from "@/components/chat/chat-widget";
import Footer from "@/components/footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KL2PEN - Professional Networking Platform",
  description: "Connect, find jobs, and grow your career with KL2PEN",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Header />
          <main className="min-h-screen pt-16">{children}</main>
          <Footer />

          <ChatWidget />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
