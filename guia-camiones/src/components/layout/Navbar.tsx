"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, MapPin, Menu, X, ChevronDown } from "lucide-react";

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
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sugerenciasRef = useRef<HTMLDivElement>(null);
  const serviciosRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/servicios")
      .then((res) => res.json())
      .then((data: { nombre: string }[]) => {
        const sugerencias = data.map((s) => ({
          tipo: "servicio" as const,
          nombre: s.nombre,
        }));
        setSugerenciasServicios(sugerencias);
      })
      .catch((err) => console.error("Error al cargar servicios:", err));
  }, []);

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBuscar();
    }
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
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Cerrar menú al hacer scroll
  useEffect(() => {
    const handleScroll = () => {
      if (showMenu) setShowMenu(false);
    };

    if (showMenu) {
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [showMenu]);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Aumenté la altura: h-24 en móvil, h-28 en tablet, h-32 en desktop */}
        <div className="flex h-24 sm:h-28 lg:h-32 items-center justify-between">
          {/* Logo - Mejorado para móvil */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
              <div className="relative">
                <Image
                  src="/img/LogoGA.png"
                  alt="Logo de Guía Atmosféricos"
                  width={80}
                  height={80}
                  className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full transition-transform group-hover:scale-105 object-cover"
                  priority
                />
              </div>
              {/* Ahora el nombre es visible en todos los tamaños de pantalla */}
              <div className="flex flex-col">
                <div className="text-sm sm:text-base lg:text-lg font-bold text-[#1c2e39] leading-tight">
                  <div>GUÍA DE CAMIONES</div>
                  <div>ATMOSFÉRICOS</div>
                </div>
              </div>
            </Link>
          </div>

          {/* Buscador Desktop */}
          <div
            className={`hidden lg:flex items-center transition-all duration-300 ${
              isSearchFocused ? "scale-105" : ""
            }`}
          >
            <div className="flex items-center bg-gray-50 rounded-xl border-2 border-transparent hover:border-gray-200 focus-within:border-[#1c2e39] focus-within:bg-white transition-all duration-200 shadow-sm">
              {/* Selector de servicios */}
              <div className="relative" ref={serviciosRef}>
                <select
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="w-48 xl:w-56 bg-transparent border-none outline-none px-4 py-4 text-sm text-gray-700 cursor-pointer appearance-none"
                >
                  <option value="">¿Qué servicio buscás?</option>
                  {sugerenciasServicios.map((sug, idx) => (
                    <option key={idx} value={sug.nombre}>
                      {sug.nombre}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>

              {/* Separador */}
              <div className="w-px h-10 bg-gray-300"></div>

              {/* Input de ubicación */}
              <div className="relative" ref={sugerenciasRef}>
                <div className="flex items-center">
                  <MapPin size={18} className="ml-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="¿Dónde?"
                    value={ubicacion}
                    onChange={handleUbicacionChange}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    onKeyPress={handleKeyPress}
                    className="w-44 xl:w-52 bg-transparent border-none outline-none px-3 py-4 text-sm text-gray-700 placeholder-gray-500"
                  />
                </div>

                {showSugerencias && sugerencias.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-auto z-50">
                    {sugerencias.map((sug, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectSugerencia(sug)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-sm border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-gray-400" />
                          <span>
                            {sug.tipo === "provincia"
                              ? sug.nombre
                              : sug.tipo === "localidad"
                              ? `${sug.nombre}, ${sug.provincia}`
                              : sug.nombre}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Botón buscar */}
              <button
                onClick={handleBuscar}
                className="bg-[#1c2e39] hover:bg-[#15253a] text-white px-6 py-4 rounded-r-xl transition-colors duration-200 flex items-center gap-2 font-medium"
              >
                <Search size={20} />
                <span className="hidden xl:inline">Buscar</span>
              </button>
            </div>
          </div>

          {/* Botones de acción Desktop */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/login"
              className="bg-gray-100 hover:bg-gray-200 text-[#1c2e39] px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/registro"
              className="bg-[#1c2e39] hover:bg-[#15253a] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              Registrá tu Empresa
            </Link>
          </div>

          {/* Menú móvil toggle */}
          <button
            onClick={toggleMenu}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={showMenu ? "Cerrar menú" : "Abrir menú"}
          >
            {showMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Menú móvil desplegable */}
        <div
          className={`lg:hidden transition-all duration-300 ease-in-out ${
            showMenu
              ? "max-h-[500px] opacity-100 visible pb-6"
              : "max-h-0 opacity-0 invisible overflow-hidden"
          }`}
        >
          <div className="pt-4 space-y-4">
            {/* Buscador móvil */}
            <div className="space-y-3">
              <div className="relative">
                <select
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm bg-white focus:border-[#1c2e39] focus:ring-2 focus:ring-[#1c2e39]/20 outline-none appearance-none"
                >
                  <option value="">¿Qué servicio buscás?</option>
                  {sugerenciasServicios.map((sug, idx) => (
                    <option key={idx} value={sug.nombre}>
                      {sug.nombre}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="¿Dónde?"
                  value={ubicacion}
                  onChange={handleUbicacionChange}
                  onKeyPress={handleKeyPress}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 pl-10 text-sm focus:border-[#1c2e39] focus:ring-2 focus:ring-[#1c2e39]/20 outline-none"
                />
                <MapPin
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                {showSugerencias && sugerencias.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-auto z-50">
                    {sugerencias.map((sug, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectSugerencia(sug)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-sm border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-gray-400" />
                          <span>
                            {sug.tipo === "provincia"
                              ? sug.nombre
                              : sug.tipo === "localidad"
                              ? `${sug.nombre}, ${sug.provincia}`
                              : sug.nombre}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleBuscar}
                className="w-full bg-[#1c2e39] text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-[#15253a] transition-colors"
              >
                <Search size={18} />
                Buscar
              </button>
            </div>

            {/* Enlaces móvil */}
            <div className="pt-4 border-t border-gray-200 space-y-3">
              <Link
                href="/login"
                onClick={() => setShowMenu(false)}
                className="block w-full text-center py-3 border border-[#1c2e39] text-[#1c2e39] rounded-lg font-medium hover:bg-[#1c2e39] hover:text-white transition-colors"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/registro"
                onClick={() => setShowMenu(false)}
                className="block w-full text-center py-3 bg-[#1c2e39] text-white rounded-lg font-medium hover:bg-[#15253a] transition-colors"
              >
                Registrá tu Empresa
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
