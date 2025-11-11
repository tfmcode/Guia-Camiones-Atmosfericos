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
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Guía C.A." />

        {/* Google Maps */}
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,geometry&language=es&region=AR`}
          strategy="beforeInteractive"
        />

        {/* ========================================
            Google Tag Manager (única instalación)
           ======================================== */}
        {/* Inicializo dataLayer y Consent Mode por si GTM lo necesita */}
        <Script id="gtm-datalayer" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            // Opcional: consent default (ajústalo si usas CMP)
            window.dataLayer.push({
              event: 'default_consent',
              ad_user_data: 'granted',
              ad_personalization: 'granted',
              ad_storage: 'granted',
              analytics_storage: 'granted',
            });
          `}
        </Script>

        {/* Contenedor GTM */}
        <Script id="gtm-script" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-NLHP8RM7');
          `}
        </Script>
      </head>

      <body className="bg-white text-gray-900">
        {/* Fallback GTM */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NLHP8RM7"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        {/* Botones flotantes */}
        <WhatsappFloating />
        <ProximidadFloating />

        {/* App */}
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
