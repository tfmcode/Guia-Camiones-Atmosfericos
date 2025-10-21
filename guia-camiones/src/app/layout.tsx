// src/app/layout.tsx
import React from "react";
import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import LayoutContent from "@/components/layout/LayoutContent";
import { AuthProvider } from "@/context/AuthContext";
import WhatsappFloating from "@/components/ui/WhatsappFloating";
import ProximidadFloating from "@/components/ui/ProximidadFloating";

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
        {/* PWA Metadata */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Guía C.A." />

        {/* ========================================
            🗺️ GOOGLE MAPS
            ======================================== */}
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,geometry&language=es&region=AR`}
          strategy="beforeInteractive"
        />

        {/* ========================================
            📊 GOOGLE TAG MANAGER (GTM)
            ======================================== */}
        <Script id="gtm-head" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-NLHP8RM7');
          `}
        </Script>

        {/* ========================================
            🎯 GOOGLE ADS (Conversión)
            ID: AW-307646210
            ======================================== */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-307646210"
          strategy="afterInteractive"
        />

        <Script id="google-ads-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-307646210');
          `}
        </Script>
      </head>

      <body className="bg-white text-gray-900">
        {/* GTM noscript fallback */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NLHP8RM7"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>

        {/* Floating components */}
        <WhatsappFloating />
        <ProximidadFloating />

        {/* Main app */}
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
