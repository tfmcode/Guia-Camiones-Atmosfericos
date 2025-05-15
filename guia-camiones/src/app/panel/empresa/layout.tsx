"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function EmpresaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.rol !== "empresa")) {
      router.push("/unauthorized");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="p-6">Cargando panel...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-cyan-700 text-white p-4 font-semibold">
        Panel de Empresa — {user.nombre}
      </header>
      <main className="flex-grow p-6">{children}</main>
    </div>
  );
}
