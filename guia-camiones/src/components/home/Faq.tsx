"use client";

import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

// Importa estilos de Swiper
import "swiper/css";
import "swiper/css/autoplay";

const preguntas = [
  {
    titulo: "Sobre el Servicio y Cuándo Solicitarlo",
    slug: "servicio-cuando-solicitarlo",
  },
  {
    titulo: "Normativas y seguridad",
    slug: "normativas-y-seguridad",
  },
  {
    titulo: "Costos y Presupuestos",
    slug: "costos-y-presupuestos",
  },
  {
    titulo: "Mantenimiento y Prevención",
    slug: "mantenimiento-y-prevencion",
  },
  {
    titulo: "Sobre la Empresa y la Flota",
    slug: "empresa-y-flota",
  },
];

const images = ["/img/empresa1.png", "/img/empresa2.png"];

const Faq = () => {
  return (
    <section className="bg-zinc-900 text-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Columna izquierda: Preguntas */}
        <div className="lg:col-span-2">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-10 text-center">
            Preguntas Frecuentes
          </h2>

          <ul className="space-y-4">
            {preguntas.map((item, index) => (
              <li key={index}>
                <Link
                  href={`/faq/${item.slug}`}
                  className="block bg-zinc-800 border border-zinc-700 rounded-lg px-5 py-4 hover:bg-zinc-700 transition text-lg font-medium"
                >
                  {item.titulo}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Columna derecha: Carrusel */}
        <div className="flex flex-col items-center lg:items-start justify-center ">
          <h3 className="text-xl font-semibold mb-6 text-center lg:text-left">
            Empresas que cumplen estas condiciones
          </h3>

          <Swiper
            modules={[Autoplay]}
            autoplay={{ delay: 1250, disableOnInteraction: false }}
            loop={true}
            spaceBetween={16}
            className="w-full max-w-sm rounded-lg overflow-hidden shadow-md"
          >
            {images.map((src, idx) => (
              <SwiperSlide key={idx}>
                <div className="w-full h-52 bg-zinc-800 flex items-center justify-center rounded-lg">
                  <Image
                    src={src}
                    alt={`empresa ${idx + 1}`}
                    width={400}
                    height={208}
                    className="object-contain w-full h-full"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
};

export default Faq;
