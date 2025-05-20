// app/layout.tsx (SERVER COMPONENT)
import "@/styles/globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import LayoutContent from "@/components/layout/LayoutContent";

export const metadata: Metadata = {
  title: "Guía de Camiones Atmosféricos",
  description:
    "Conectamos usuarios con empresas de desagote y servicios ambientales.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-white text-gray-900">
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
