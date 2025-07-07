"use client";

import { useEffect, useRef } from "react";
import { Truck, ListTodo, Building2, Star } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Features = () => {
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      cardsRef.current.forEach((card, i) => {
        gsap.from(card, {
          opacity: 0,
          rotateX: 10,
          scale: 0.9,
          duration: 0.8,
          delay: i * 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
          },
        });
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 text-center mb-12">
        BUSCADOR DE EMPRESAS Y SERVICIOS
      </h2>

      <p className="text-center text-gray-700 font-semibold uppercase tracking-wide mb-12">
        Adquiera nuestros servicios
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {[
          {
            icon: <Truck className="w-6 h-6" />,
            title: "Guía de operadores de residuos",
            text: "Accedé al listado de empresas dedicadas a la gestión y recolección de residuos líquidos, fosas sépticas y pozos ciegos.",
          },
          {
            icon: <ListTodo className="w-6 h-6" />,
            title: "Guía de proveedores",
            text: "Encontrá fabricantes y distribuidores de insumos, equipos atmosféricos, repuestos y más para tu actividad.",
          },
          {
            icon: <Building2 className="w-6 h-6" />,
            title: "Registre gratis su empresa",
            text: "Sumá tu empresa a la guía para aumentar tu visibilidad y recibir consultas sin intermediarios.",
          },
          {
            icon: <Star className="w-6 h-6" />,
            title: "Publique un anuncio destacado",
            text: "Posicioná tu empresa entre los primeros resultados y destacate con mayor exposición frente a la competencia.",
          },
        ].map((feature, i) => (
          <div
            key={i}
            ref={(el) => {
              if (el) cardsRef.current[i] = el;
            }}
            className="group flex items-start gap-4 bg-white p-5 rounded-lg shadow-sm transform transition duration-300 ease-in-out hover:scale-110 hover:shadow-lg"
          >
            <div className="bg-[#1c2e39]/10 text-[#1c2e39] p-3 rounded-lg transition-transform duration-300 group-hover:rotate-3">
              {feature.icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;
