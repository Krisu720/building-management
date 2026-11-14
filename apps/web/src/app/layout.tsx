import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin", "latin-ext"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Building Management",
  description: "System zarządzania budynkami",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pl" className={cn("font-sans", geist.variable)}>
      <body>{children}</body>
    </html>
  );
}


