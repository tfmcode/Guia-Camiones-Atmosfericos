// components/layout/LayoutContent.tsx
"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const ocultarLayout = pathname.startsWith("/panel");

  return (
    <>
      {!ocultarLayout && <Navbar />}
      {children}
      {!ocultarLayout && <Footer />}
    </>
  );
}
