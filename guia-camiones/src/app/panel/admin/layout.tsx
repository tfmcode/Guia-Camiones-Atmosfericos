"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import LogoutButton from "@/components/layout/LogoutButton";
import Link from "next/link";
import { Menu } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { usuario, loading } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="p-6 text-center text-zinc-600">
        Cargando panel de administrador...
      </div>
    );
  }

  const navItems = [
    { label: "Inicio", href: "/panel/admin" },
    { label: "Usuarios", href: "/panel/admin/usuarios" },
    { label: "Empresas", href: "/panel/admin/empresas" },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-zinc-50">
      {/* Navbar móvil */}
      <div className="flex items-center justify-between bg-white px-4 py-3 border-b border-zinc-200 md:hidden">
        <h2 className="text-lg font-extrabold text-[#1c2e39]">Admin Panel</h2>
        <button onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">
          <Menu className="h-6 w-6 text-zinc-700" />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-zinc-200 shadow-sm px-6 py-6 flex flex-col transform transition-transform duration-200 z-50
        ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 md:flex`}
      >
        {/* Cerrar en mobile */}
        <div className="flex items-center justify-between mb-8 md:mb-8">
          <div>
            <h2 className="text-xl font-extrabold text-[#1c2e39]">
              Admin Panel
            </h2>
            <p className="text-sm text-zinc-500">
              {usuario?.nombre ?? "Administrador"}
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-zinc-600"
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>

        <nav className="flex flex-col gap-1 text-sm text-zinc-700 font-medium">
          {navItems.map(({ label, href }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg transition ${
                  isActive
                    ? "bg-[#1c2e39]/10 text-[#1c2e39] font-semibold"
                    : "hover:bg-zinc-100"
                }`}
              >
                <span>{label}</span>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-[#1c2e39]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-zinc-200">
          <LogoutButton />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-grow px-4 md:px-6 py-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
