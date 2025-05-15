"use client";

import { useState } from "react";
import Link from "next/link";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-white shadow-md border-b sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-cyan-700 font-extrabold text-lg"
          >
            🚛 Guía Camiones
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link
              href="/empresas"
              className="text-gray-700 hover:text-cyan-700 transition font-medium"
            >
              Buscar empresas
            </Link>
            <Link
              href="#servicios"
              className="text-gray-700 hover:text-cyan-700 transition font-medium"
            >
              Servicios
            </Link>
            <Link
              href="#contacto"
              className="text-gray-700 hover:text-cyan-700 transition font-medium"
            >
              Contacto
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex gap-2">
              <Link
                href="/login"
                className="bg-cyan-700 text-white px-4 py-2 rounded text-sm hover:bg-cyan-800 transition"
              >
                Ingresar
              </Link>
              <Link
                href="/registro"
                className="bg-gray-100 text-cyan-700 px-4 py-2 rounded text-sm hover:bg-gray-200 transition"
              >
                Registrarse
              </Link>
            </div>

            <button
              onClick={() => setOpen(!open)}
              className="md:hidden text-gray-600 bg-gray-100 p-2 rounded hover:bg-gray-200"
            >
              <span className="text-lg">{open ? "✖" : "☰"}</span>
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden mt-2 space-y-2 pb-4 text-sm">
            <Link
              href="/empresas"
              onClick={() => setOpen(false)}
              className="block text-gray-700 hover:text-cyan-700 px-2"
            >
              Buscar empresas
            </Link>
            <Link
              href="#servicios"
              onClick={() => setOpen(false)}
              className="block text-gray-700 hover:text-cyan-700 px-2"
            >
              Servicios
            </Link>
            <Link
              href="#contacto"
              onClick={() => setOpen(false)}
              className="block text-gray-700 hover:text-cyan-700 px-2"
            >
              Contacto
            </Link>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="block bg-cyan-700 text-white px-4 py-2 rounded mt-2 text-center"
            >
              Ingresar
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
