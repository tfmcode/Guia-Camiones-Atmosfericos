"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import LogoutButton from "@/components/layout/LogoutButton";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { usuario, loading } = useAuth();
  const pathname = usePathname();

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
    <div className="min-h-screen flex bg-zinc-50">
      <aside className="w-64 bg-white border-r border-zinc-200 shadow-sm px-6 py-6 flex flex-col">
        <div className="mb-8">
          <h2 className="text-xl font-extrabold text-[#1c2e39]">Admin Panel</h2>
          <p className="text-sm text-zinc-500">
            {usuario?.nombre ?? "Administrador"}
          </p>
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

      <main className="flex-grow px-6 py-8 overflow-x-hidden">{children}</main>
    </div>
  );
}
