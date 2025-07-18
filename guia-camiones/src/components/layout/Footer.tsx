"use client";

import Image from "next/image";
import Link from "next/link";
import { Facebook, Instagram, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-screen-xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {/* Logo + Redes */}
        <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="flex flex-col items-center gap-3 mb-6 sm:flex-row sm:mb-0"
          >
            <Image
              src="/img/LogoGA.png"
              alt="Logo"
              width={150}
              height={150}
              className="rounded-full w-32 h-32 object-cover"
            />
            <div className="flex flex-col items-center sm:items-start leading-tight">
              <span className="text-md font-bold text-[#1c2e39]">
                GUÍA DE CAMIONES
              </span>
              <span className="text-md font-bold text-[#1c2e39]">
                ATMOSFÉRICOS
              </span>
            </div>
          </Link>

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

        {/* Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-10 border-t border-gray-100 pt-10 text-center sm:text-left">
          {[
            {
              title: "Servicios",
              items: ["Desagotes", "Cañerías", "Emergencias", "Mantenimiento"],
            },
            {
              title: "Ayuda",
              items: ["Contacto", "Preguntas Frecuentes", "Soporte"],
            },
            {
              title: "Legal",
              items: ["Términos", "Política de Privacidad", "Cookies"],
            },
          ].map((section) => (
            <div key={section.title}>
              <p className="font-semibold text-zinc-900">{section.title}</p>
              <ul className="mt-4 space-y-3 text-sm">
                {section.items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
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

        <p className="text-xs text-gray-500 text-center mt-10">
          &copy; {new Date().getFullYear()} Guía de Camiones Atmosféricos. Todos
          los derechos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
