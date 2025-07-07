"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Services = () => {
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      cardsRef.current.forEach((card, i) => {
        gsap.from(card, {
          opacity: 0,
          y: 50,
          scale: 0.9,
          duration: 0.8,
          delay: i * 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 90%",
          },
        });
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section className="relative bg-white py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Divider decorativo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-[#1c2e39] rounded-full" />

      <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 text-center mb-14">
        Servicios Más Solicitados
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {[
          {
            title: "Desagote de Pozos Ciegos",
            text: "Servicio de vaciado completo mediante succión de alta potencia, eliminando lodos y residuos acumulados. El desborde del pozo séptico provoca filtraciones en el suelo. Causando malos olores en su propiedad y sus alrededores.",
          },
          {
            title: "Desobstrucción de Cañerías",
            text: "Eliminación de bloqueos por medio de máquinas rotativas en sistemas de drenaje. Limpieza de cañerías utilizando equipos hidrojet de alta presión que restablecen el flujo normal sin dañar las tuberías existentes.",
          },
          {
            title: "Mantenimiento Preventivo",
            text: "Programas regulares de inspección con limpieza en cámaras sépticas y cañerías. Servicios adaptados a comunidades de vecinos, empresas e instituciones, previniendo emergencias y prolongando la vida útil de los sistemas.",
          },
        ].map((service, i) => (
          <div
            key={i}
            ref={(el) => {
              if (el) cardsRef.current[i] = el;
            }}
            className="group relative overflow-hidden rounded-2xl p-6 bg-[#f5f7f9] hover:bg-[#e4e9ed] transition duration-300 shadow-sm hover:shadow-xl border border-[#1c2e39]/20 cursor-pointer transform hover:scale-105 md:hover:scale-[1.1] xl:hover:scale-[1.15] hover:z-10"
          >
            <div className="transition-transform duration-300 ease-out group-hover:scale-105">
              <h3 className="text-xl font-bold text-[#1c2e39] mb-3">
                {service.title}
              </h3>
              <p className="text-gray-700 leading-relaxed">{service.text}</p>
            </div>
            {/* Glow efecto opcional */}
            <div className="absolute inset-0 rounded-2xl bg-[#1c2e39]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default Services;
