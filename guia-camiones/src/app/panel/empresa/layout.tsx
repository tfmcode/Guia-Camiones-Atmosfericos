"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import LogoutButton from "@/components/layout/LogoutButton";
import Link from "next/link";

export default function EmpresaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { usuario, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!usuario || usuario.rol !== "EMPRESA")) {
      router.push("/unauthorized");
    }
  }, [usuario, loading, router]);

  if (loading || !usuario) {
    return (
      <div className="p-6 text-center text-zinc-600">
        Cargando panel de empresa...
      </div>
    );
  }

  const navItems = [
    { label: "Mi Empresa", href: "/panel/empresa" },
    // { label: "Torneos", href: "/panel/empresa/torneos" },
    // { label: "Cuenta corriente", href: "/panel/empresa/cuenta" },
  ];

  return (
    <div className="min-h-screen flex bg-zinc-50">
      <aside className="w-64 bg-white border-r border-zinc-200 shadow-sm px-6 py-6 flex flex-col">
        <div className="mb-8">
          <h2 className="text-xl font-extrabold text-rose-600">
            Panel Empresa
          </h2>
          <p className="text-sm text-zinc-500">{usuario.nombre}</p>
        </div>

        <nav className="flex flex-col gap-1 text-sm text-zinc-700 font-medium">
          {navItems.map(({ label, href }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center justify-between px-3 py-2 rounded-lg transition ${
                  isActive
                    ? "bg-rose-100 text-rose-700 font-semibold"
                    : "hover:bg-zinc-100"
                }`}
              >
                <span>{label}</span>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-zinc-200">
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-grow px-6 py-8 overflow-x-hidden">{children}</main>
    </div>
  );
}
