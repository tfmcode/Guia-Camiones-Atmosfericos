"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Hero = () => {
  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const textRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(titleRef.current, {
        opacity: 0,
        y: -50,
        duration: 1,
        ease: "power3.out",
      });

      gsap.from(textRef.current, {
        opacity: 0,
        y: 50,
        duration: 1,
        delay: 0.3,
        ease: "power3.out",
      });

      gsap.from(buttonRef.current, {
        opacity: 0,
        scale: 0.9,
        duration: 0.8,
        delay: 0.6,
        ease: "back.out(1.7)",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[90vh] flex flex-col items-center justify-center text-white overflow-hidden"
    >
      {/* Imagen de fondo */}
      <Image
        src="/img/portada.png"
        alt="Camión atmosférico"
        layout="fill"
        objectFit="cover"
        objectPosition="center"
        className="absolute inset-0 z-0"
        priority
      />

      <div className="absolute inset-0 bg-black/70 z-10" />

      <div className="relative z-20 text-center px-6 max-w-3xl">
        <h1
          ref={titleRef}
          className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-6 drop-shadow-lg"
        >
          Guía Nacional de Camiones Atmosféricos
        </h1>
        <p
          ref={textRef}
          className="text-lg md:text-xl text-gray-200 mb-8 drop-shadow"
        >
          Conectamos usuarios con empresas especializadas en desagotes,
          mantenimiento de pozos ciegos y gestión de residuos líquidos en todo
          el país.
        </p>
        <div ref={buttonRef}>
          <Link
            href="/empresas"
            className="inline-block text-white font-semibold px-6 py-3 rounded-full shadow-md transition duration-300 hover:scale-105 hover:shadow-lg"
            style={{ background: "#1c2e39" }}
          >
            Buscar Servicio
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
