import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ToastContainer from "./components/ToastContainer";
import NotificationPortal from "./components/NotificationPortal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Caaqui ProjectOps",
  description: "Sistema leve para governança de projetos, squads e OKRs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body className={`bg-gray-50 ${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen">
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900">Caaqui ProjectOps</h1>
                <span className="text-sm text-gray-500">Sistema de Gestão de Projetos</span>
              </div>
              <div className="flex items-center gap-4">
                <NotificationPortal />
              </div>
            </div>
          </header>
          <main>
            {children}
          </main>
        </div>
        <ToastContainer />
      </body>
    </html>
  );
}
