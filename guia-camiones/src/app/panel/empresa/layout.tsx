"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import LogoutButton from "@/components/layout/LogoutButton";
import Link from "next/link";
import { Bars3Icon } from "@heroicons/react/24/outline";

const SIDEBAR_WIDTH = "w-64"; // un solo punto de verdad

export default function EmpresaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="p-6 text-center text-zinc-600">
        Cargando panel de empresa...
      </div>
    );
  }

  const nav: { label: string; href: string }[] = [
    { label: "Mi Empresa", href: "/panel/empresa" },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const Sidebar = (
    <aside
      className={`h-full ${SIDEBAR_WIDTH} bg-white border-r border-zinc-200 shadow-sm flex flex-col overflow-y-auto`}
    >
      <div className="px-6 py-6">
        <h2 className="text-xl font-extrabold text-[#172a56] mb-1">
          Panel Empresa
        </h2>
      </div>

      <nav className="px-6 flex flex-col gap-1 text-sm font-medium">
        {nav.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center justify-between px-3 py-2 rounded-lg transition ${
              isActive(href)
                ? "bg-[#e4e7f2] text-[#172a56] font-semibold"
                : "text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            <span>{label}</span>
            {isActive(href) && (
              <span className="w-2 h-2 rounded-full bg-[#172a56]" />
            )}
          </Link>
        ))}
      </nav>

      <div className="mt-auto px-6 py-6 border-t border-zinc-200">
        <LogoutButton />
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Desktop layout */}
      <div className="hidden md:grid md:grid-cols-[16rem_1fr]">
        {Sidebar}
        <main className="px-8 py-10 overflow-x-auto">{children}</main>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden">
        <header className="fixed inset-x-0 top-0 h-14 bg-white border-b border-zinc-200 shadow-sm flex items-center justify-between px-4 z-40">
          <h1 className="text-lg font-bold text-[#172a56]">Panel Empresa</h1>
          <button onClick={() => setOpen(true)}>
            <Bars3Icon className="w-6 h-6 text-zinc-700" />
          </button>
        </header>

        {open && (
          <div className="fixed inset-0 z-40 flex">
            <div className="relative transform transition-transform duration-300 translate-x-0">
              {Sidebar}
            </div>
            <div
              className="flex-grow bg-black/40"
              onClick={() => setOpen(false)}
            />
          </div>
        )}

        <main className="pt-16 px-4 sm:px-6 pb-10">{children}</main>
      </div>
    </div>
  );
}
