import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Painel MedSync",
  description: "Interface em TypeScript + Tailwind para o MedSync"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-100 text-slate-900">{children}</body>
    </html>
  );
}
