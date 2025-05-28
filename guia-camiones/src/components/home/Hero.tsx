"use client";

import Link from "next/link";
import Image from "next/image";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-white overflow-hidden">
      {/* Imagen de fondo usando Next/Image */}
      <Image
        src="/img/portada.png"
        alt="Camión atmosférico"
        layout="fill"
        objectFit="cover"
        objectPosition="center"
        className="absolute inset-0 z-0"
        priority
      />

      {/* Capa oscura sobre la imagen */}
      <div className="absolute inset-0 bg-black/70 z-10" />

      {/* Contenido encima */}
      <div className="relative z-20 text-center px-6 max-w-3xl">
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
