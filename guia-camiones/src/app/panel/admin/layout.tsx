"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LogoutButton from "@/components/layout/LogoutButton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.rol !== "ADMIN")) {
      router.push("/unauthorized");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="p-6">Cargando panel de administrador...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-slate-800 text-white p-4 flex justify-between items-center">
        <span className="font-semibold">
          Panel de Administrador — {user.nombre}
        </span>
        <LogoutButton />
      </header>
      <main className="flex-grow p-6">{children}</main>
    </div>
  );
}
