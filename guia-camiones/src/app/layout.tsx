import React from "react";
import "./globals.css";
import type { Metadata } from "next";
import LayoutContent from "@/components/layout/LayoutContent";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Guía de Camiones Atmosféricos",
  description:
    "Conectamos usuarios con empresas de desagote y servicios ambientales.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        {/* 👇 Metadatos PWA extras */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Guía C.A." />
      </head>
      <body className="bg-white text-gray-900">
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
