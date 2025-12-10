import type { Metadata } from "next";
import "./globals.css";
import { ClientLayout } from "./client-layout";

export const metadata: Metadata = {
  title: "InterviewPilot AI - AI-Powered Interview Assistant",
  description:
    "Generate structured interview questions, evaluation criteria, and scorecards tailored to any role. Standardize your interview process with AI.",
  keywords: [
    "interview",
    "hiring",
    "HR",
    "AI",
    "interview questions",
    "scorecard",
    "recruitment",
  ],
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}



