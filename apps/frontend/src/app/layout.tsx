import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { TopNav } from "@/components/layout/TopNav";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Swahit - Personal Therapy & Self-Help",
  description: "Your safe space for personal therapy. Connect with AI chatbots and certified doctors.",
};

import { EntitlementProvider } from "@/context/entitlement-context";
import { UpgradeModal } from "@/components/upgrade-modal";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans text-foreground bg-background">
        <AuthProvider>
          <EntitlementProvider>
            <TopNav />
            {children}
            <UpgradeModal />
            <Toaster />
          </EntitlementProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
