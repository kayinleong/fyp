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
import FacialProtectionWrapper from "@/components/auth/facial-protection-wrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RabbitJob - Professional Networking Platform",
  description: "Connect, find jobs, and grow your career with RabbitJob",
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
          <FacialProtectionWrapper>
            <Header />
            <main className="min-h-screen pt-16">{children}</main>
            <Footer />

            <ChatWidget />
            <Toaster />
          </FacialProtectionWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
