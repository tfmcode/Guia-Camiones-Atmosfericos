"use client";

import Link from "next/link";

const Hero = () => {
  return (
    <section
      className="relative bg-cover bg-center bg-no-repeat min-h-[90vh] flex items-center justify-center text-white"
      style={{
        backgroundImage: "url('/placeholder.jpg')", // ✅ ESTA ES LA RUTA CORRECTA
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-70" />

      <div className="relative z-10 text-center px-6 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-6 drop-shadow-lg">
          Guía Nacional de Camiones Atmosféricos
        </h1>
        <p className="text-lg md:text-xl text-gray-200 mb-8 drop-shadow">
          Conectamos usuarios con empresas especializadas en desagotes,
          mantenimiento de pozos ciegos y gestión de residuos líquidos en todo
          el país.
        </p>
        <Link
          href="/empresas"
          className="inline-block bg-rose-600 hover:bg-rose-700 text-white font-semibold px-6 py-3 rounded-full shadow-md transition duration-300"
        >
          Buscar Servicio
        </Link>
      </div>
    </section>
  );
};

export default Hero;
