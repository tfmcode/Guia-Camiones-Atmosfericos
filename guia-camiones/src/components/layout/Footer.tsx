"use client";

import Image from "next/image";
import Link from "next/link";
import { Facebook, Instagram, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-screen-xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {/* Logo + Redes */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo + Título */}
          <Link
            href="/"
            className="flex items-center gap-4 text-center sm:text-left"
          >
            <Image
              src="/img/LogoGA.png"
              alt="Logo"
              width={100}
              height={100}
              className="rounded-full object-cover"
            />
            <div className="leading-tight">
              <p className="text-lg font-bold text-[#1c2e39]">
                GUÍA DE CAMIONES
              </p>
              <p className="text-lg font-bold text-[#1c2e39]">ATMOSFÉRICOS</p>
            </div>
          </Link>

          {/* Redes sociales */}
          <div className="flex gap-6">
            <a
              href="#"
              target="_blank"
              rel="noreferrer"
              className="text-gray-700 hover:text-cyan-700 transition"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="#"
              target="_blank"
              rel="noreferrer"
              className="text-gray-700 hover:text-cyan-700 transition"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="#"
              target="_blank"
              rel="noreferrer"
              className="text-gray-700 hover:text-cyan-700 transition"
            >
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Links + Contacto */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-10 border-t border-gray-100 pt-10 text-center sm:text-left">
          {[
            {
              title: "Servicios",
              items: ["Desagotes", "Cañerías", "Emergencias", "Mantenimiento"],
            },
            {
              title: "Ayuda",
              items: ["Contacto", "Preguntas Frecuentes"],
            },
            {
              title: "Contacto",
              items: ["Tel: 11 5564 6135", "Mail: hola@guía-atmosfericos.com"],
            },
          ].map((section) => (
            <div key={section.title}>
              <p className="font-semibold text-zinc-900">{section.title}</p>
              <ul className="mt-4 space-y-3 text-sm">
                {section.items.map((item) => (
                  <li key={item}>
                    <a
                      href={
                        item.includes("Mail")
                          ? "mailto:hola@guía-atmosfericos.com"
                          : item.includes("Tel")
                          ? "https://wa.me/5491155646135?text=" +
                            encodeURIComponent(
                              "Hola! Estoy viendo su web y quiero hacer una consulta."
                            )
                          : "#"
                      }
                      target={item.includes("Tel") ? "_blank" : undefined}
                      rel={
                        item.includes("Tel") ? "noopener noreferrer" : undefined
                      }
                      className="text-gray-600 hover:text-cyan-700 transition"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Derechos */}
        <p className="text-xs text-gray-500 text-center mt-10">
          &copy; {new Date().getFullYear()} Guía de Camiones Atmosféricos. Todos
          los derechos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
