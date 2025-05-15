"use client";

import Link from "next/link";

const Hero = () => {
  return (
    <section
      className="relative bg-cover bg-center bg-no-repeat min-h-[80vh] flex items-center justify-center text-white"
      style={{
        backgroundImage: "url('/images/hero.png')",
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-60" />

      <div className="relative z-10 text-center px-4 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6">
          Guía Nacional de Camiones Atmosféricos
        </h1>
        <p className="text-lg md:text-xl text-gray-200 mb-8">
          Conectamos usuarios con empresas especializadas en desagotes, pozos
          ciegos y gestión de residuos líquidos. Rápido, sin vueltas.
        </p>
        <Link
          href="/empresas"
          className="inline-block bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition"
        >
          Buscar Servicio
        </Link>
      </div>
    </section>
  );
};

export default Hero;
