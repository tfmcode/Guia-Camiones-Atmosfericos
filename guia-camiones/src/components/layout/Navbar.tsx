"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Sugerencia =
  | { tipo: "provincia"; nombre: string }
  | { tipo: "localidad"; nombre: string; provincia: string }
  | { tipo: "servicio"; nombre: string };

const Navbar = () => {
  const router = useRouter();

  const [busqueda, setBusqueda] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState("");
  const [localidadSeleccionada, setLocalidadSeleccionada] = useState("");

  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [sugerenciasServicios, setSugerenciasServicios] = useState<
    Sugerencia[]
  >([]);
  const [showSugerencias, setShowSugerencias] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutServiciosRef = useRef<NodeJS.Timeout | null>(null);
  const sugerenciasRef = useRef<HTMLDivElement>(null);
  const serviciosRef = useRef<HTMLDivElement>(null);

  const buscarUbicacion = (texto: string) => {
    if (texto.length < 2) {
      setSugerencias([]);
      return;
    }

    const encoded = encodeURIComponent(texto);

    Promise.all([
      fetch(
        `https://apis.datos.gob.ar/georef/api/provincias?nombre=${encoded}&max=5`
      )
        .then((res) => res.json())
        .then((data) =>
          data.provincias.map((p: { nombre: string }) => ({
            tipo: "provincia",
            nombre: p.nombre,
          }))
        ),
      fetch(
        `https://apis.datos.gob.ar/georef/api/municipios?nombre=${encoded}&max=5&campos=nombre,provincia`
      )
        .then((res) => res.json())
        .then((data) =>
          data.municipios.map(
            (m: { nombre: string; provincia: { nombre: string } }) => ({
              tipo: "localidad",
              nombre: m.nombre,
              provincia: m.provincia.nombre,
            })
          )
        ),
    ]).then(([provincias, localidades]) => {
      setSugerencias([...provincias, ...localidades]);
      setShowSugerencias(true);
    });
  };

  const buscarServicios = (texto: string) => {
    if (texto.length < 2) {
      setSugerenciasServicios([]);
      return;
    }

    const encoded = encodeURIComponent(texto);

    fetch(`/api/servicios?q=${encoded}`)
      .then((res) => res.json())
      .then((data: { nombre: string }[]) => {
        const sugerencias = data.map((s) => ({
          tipo: "servicio" as const,
          nombre: s.nombre,
        }));

        setSugerenciasServicios(sugerencias);
        setShowSugerencias(true);
      });
  };

  const handleUbicacionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUbicacion(value);
    setShowSugerencias(false);
    setProvinciaSeleccionada("");
    setLocalidadSeleccionada("");

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      buscarUbicacion(value);
    }, 300);
  };

  const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBusqueda(value);
    setShowSugerencias(false);

    if (timeoutServiciosRef.current) clearTimeout(timeoutServiciosRef.current);
    timeoutServiciosRef.current = setTimeout(() => {
      buscarServicios(value);
    }, 300);
  };

  const handleSelectSugerencia = (sug: Sugerencia) => {
    if (sug.tipo === "provincia") {
      setProvinciaSeleccionada(sug.nombre);
      setLocalidadSeleccionada("");
      setUbicacion(sug.nombre);
    } else if (sug.tipo === "localidad") {
      setProvinciaSeleccionada(sug.provincia);
      setLocalidadSeleccionada(sug.nombre);
      setUbicacion(`${sug.nombre}, ${sug.provincia}`);
    } else if (sug.tipo === "servicio") {
      setBusqueda(sug.nombre);
    }
    setShowSugerencias(false);
  };

  const handleBuscar = () => {
    const params = new URLSearchParams();

    if (busqueda.trim()) params.set("servicio", busqueda.trim());
    if (provinciaSeleccionada) params.set("provincia", provinciaSeleccionada);
    if (localidadSeleccionada) params.set("localidad", localidadSeleccionada);
    params.set("pagina", "1");

    router.push(`/empresas?${params.toString()}`);
  };

  const toggleMenu = () => setShowMenu((prev) => !prev);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        !sugerenciasRef.current?.contains(event.target as Node) &&
        !serviciosRef.current?.contains(event.target as Node)
      ) {
        setShowSugerencias(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSugerencias(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-28 items-center justify-between gap-4">
          {/* IZQUIERDA: Logo + texto */}
          <div className="flex items-center gap-2 w-1/3">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/img/LogoGA.png"
                alt="Logo de Guía Atmosféricos"
                width={200}
                height={100}
              />
              <div className="flex flex-col items-start leading-tight">
                <span className="text-md font-bold text-[#1c2e39]">
                  GUÍA DE CAMIONES
                </span>
                <span className="text-md font-bold text-[#1c2e39]">
                  ATMOSFÉRICOS
                </span>
              </div>
            </Link>
          </div>

          {/* CENTRO: Buscadores */}
          <div className="hidden lg:flex gap-2 items-center w-1/3 justify-center">
            <div className="relative w-40" ref={serviciosRef}>
              <input
                type="text"
                placeholder="¿Qué buscás?"
                value={busqueda}
                onChange={handleBusquedaChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1c2e39]"
              />
              {showSugerencias && sugerenciasServicios.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow-md max-h-60 overflow-auto text-sm">
                  {sugerenciasServicios.map((sug, idx) => (
                    <li
                      key={idx}
                      onClick={() => handleSelectSugerencia(sug)}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {sug.nombre}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="relative w-56" ref={sugerenciasRef}>
              <input
                type="text"
                placeholder="¿Dónde?"
                value={ubicacion}
                onChange={handleUbicacionChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1c2e39]"
              />
              {showSugerencias && sugerencias.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow-md max-h-60 overflow-auto text-sm">
                  {sugerencias.map((sug, idx) => (
                    <li
                      key={idx}
                      onClick={() => handleSelectSugerencia(sug)}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {sug.tipo === "provincia"
                        ? sug.nombre
                        : sug.tipo === "localidad"
                        ? `${sug.nombre}, ${sug.provincia}`
                        : sug.nombre}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              onClick={handleBuscar}
              className="bg-[#1c2e39] text-white px-4 py-2 rounded text-sm hover:opacity-90 transition"
            >
              Buscar
            </button>
          </div>

          {/* DERECHA: Login / Registro */}
          <div className="flex items-center justify-end w-1/3 gap-4">
            <div className="hidden md:flex gap-2">
              <Link
                href="/login"
                className="rounded-md bg-[#1c2e39] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Login
              </Link>
              <Link
                href="/registro"
                className="hidden sm:inline-block rounded-md border border-[#1c2e39] px-4 py-2 text-sm font-medium text-[#1c2e39] hover:bg-[#1c2e39] hover:text-white transition"
              >
                Registrá tu negocio
              </Link>
            </div>

            {/* Botón hamburguesa */}
            <button
              onClick={toggleMenu}
              className="md:hidden rounded-sm bg-gray-100 p-2 text-gray-600 hover:text-gray-800"
              aria-label="Abrir menú"
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

        {/* Menú móvil desplegable */}
        {showMenu && (
          <div className="md:hidden mt-4 flex flex-col gap-4" style={{ marginBottom: "16px" }}>
            <div className="flex flex-col gap-2">
              <div className="relative w-full" ref={serviciosRef}>
                <input
                  type="text"
                  placeholder="¿Qué buscás?"
                  value={busqueda}
                  onChange={handleBusquedaChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
                {showSugerencias && sugerenciasServicios.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow-md max-h-60 overflow-auto text-sm">
                    {sugerenciasServicios.map((sug, idx) => (
                      <li
                        key={idx}
                        onClick={() => handleSelectSugerencia(sug)}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        {sug.nombre}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="relative w-full" ref={sugerenciasRef}>
                <input
                  type="text"
                  placeholder="¿Dónde?"
                  value={ubicacion}
                  onChange={handleUbicacionChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
                {showSugerencias && sugerencias.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow-md max-h-60 overflow-auto text-sm">
                    {sugerencias.map((sug, idx) => (
                      <li
                        key={idx}
                        onClick={() => handleSelectSugerencia(sug)}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        {sug.tipo === "provincia"
                          ? sug.nombre
                          : sug.tipo === "localidad"
                          ? `${sug.nombre}, ${sug.provincia}`
                          : sug.nombre}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                onClick={handleBuscar}
                className="bg-[#1c2e39] text-white px-4 py-2 rounded text-sm hover:opacity-90 transition"
              >
                Buscar
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href="/login"
                className="block px-4 py-2 text-sm font-medium text-[#1c2e39] border border-[#1c2e39] rounded text-center"
              >
                Login
              </Link>
              <Link
                href="/registro"
                className="block px-4 py-2 text-sm font-medium text-[#1c2e39] border border-[#1c2e39] rounded text-center"
              >
                Registrá tu negocio
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
