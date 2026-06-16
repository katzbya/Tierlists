import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TierForge",
  description: "Create and share beautiful tier lists",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
