import type { Metadata } from "next";
import { TopBar } from "@/components/app/top-bar";
import "./globals.css";

export const metadata: Metadata = {
  title: "ContractBridge",
  description:
    "Manage API contracts per project so frontend and backend build against the same spec.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <TopBar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
