"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const [busqueda, setBusqueda] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  const handleBuscar = () => {
    router.push("/empresas");
  };

  const toggleMenu = () => {
    setShowMenu((prev) => !prev);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between relative">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="block text-red-600">
              <span className="sr-only">Home</span>
              <span className="text-xl font-bold">Guía Atmosfericos</span>
            </Link>
          </div>

          {/* Buscador */}
          <div className="absolute left-1/2 -translate-x-1/2 hidden lg:flex gap-2 items-center">
            <input
              type="text"
              placeholder="¿Qué buscás?"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-44 border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="¿Dónde?"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              className="w-44 border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <button
              onClick={handleBuscar}
              className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600"
            >
              Buscar
            </button>
          </div>

          {/* Login / Registro */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-2">
              <Link
                href="/login"
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm"
              >
                Login
              </Link>
              <Link
                href="/registro"
                className="hidden sm:inline-block rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-red-600"
              >
                Registrá tu negocio
              </Link>
            </div>

            {/* Botón hamburguesa */}
            <div className="block md:hidden">
              <button
                onClick={toggleMenu}
                className="rounded-sm bg-gray-100 p-2 text-gray-600 transition hover:text-gray-600/75"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Menú móvil */}
        {showMenu && (
          <div className="md:hidden mt-2 flex flex-col gap-2">
            <Link
              href="/login"
              className="block px-4 py-2 text-sm font-medium text-red-600"
            >
              Login
            </Link>
            <Link
              href="/registro"
              className="block px-4 py-2 text-sm font-medium text-red-600"
            >
              Registrá tu negocio
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
