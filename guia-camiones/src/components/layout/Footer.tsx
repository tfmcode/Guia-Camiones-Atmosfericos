"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Facebook,
  Instagram,
  Twitter,
  Phone,
  Mail,
  ArrowRight,
} from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200">
      {/* Sección principal */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Logo y descripción */}
          <div className="lg:col-span-1 space-y-6">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/img/LogoGA.png"
                alt="Logo Guía de Camiones Atmosféricos"
                width={60}
                height={60}
                className="rounded-full object-cover"
              />
              <div className="leading-tight">
                <p className="text-lg font-bold text-[#1c2e39]">
                  GUÍA DE CAMIONES
                </p>
                <p className="text-lg font-bold text-[#1c2e39]">ATMOSFÉRICOS</p>
              </div>
            </Link>

            <p className="text-gray-600 text-sm leading-relaxed">
              Conectamos usuarios con empresas especializadas en desagotes,
              mantenimiento de pozos ciegos y gestión de residuos líquidos en
              todo el país.
            </p>

            {/* Redes sociales */}
            <div className="flex gap-4">
              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-[#1c2e39] transition-all duration-200 group"
                aria-label="Facebook"
              >
                <Facebook
                  size={18}
                  className="text-gray-600 group-hover:text-white transition-colors"
                />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-[#1c2e39] transition-all duration-200 group"
                aria-label="Instagram"
              >
                <Instagram
                  size={18}
                  className="text-gray-600 group-hover:text-white transition-colors"
                />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-[#1c2e39] transition-all duration-200 group"
                aria-label="Twitter"
              >
                <Twitter
                  size={18}
                  className="text-gray-600 group-hover:text-white transition-colors"
                />
              </a>
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-[#1c2e39]">
              Enlaces Rápidos
            </h3>
            <ul className="space-y-3">
              {[
                { label: "Buscar Empresas", href: "/empresas" },
                { label: "Registrar Empresa", href: "/registro" },
                { label: "Preguntas Frecuentes", href: "/#faq" },
                { label: "Iniciar Sesión", href: "/login" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-600 hover:text-[#1c2e39] transition-colors duration-200 flex items-center gap-2 group text-sm"
                  >
                    <ArrowRight
                      size={14}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Servicios */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-[#1c2e39]">Servicios</h3>
            <ul className="space-y-3">
              {[
                "Desagote de Pozos Ciegos",
                "Desobstrucción de Cañerías",
                "Servicios de Emergencia",
                "Mantenimiento Preventivo",
                "Certificaciones Ambientales",
              ].map((servicio) => (
                <li key={servicio}>
                  <span className="text-gray-600 text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#1c2e39] rounded-full"></span>
                    {servicio}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-[#1c2e39]">Contacto</h3>
            <div className="space-y-4">
              <a
                href="https://wa.me/5491155646135?text=Hola! Estoy viendo su web y quiero hacer una consulta."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-600 hover:text-[#1c2e39] transition-colors duration-200 group"
              >
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Phone size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">WhatsApp</p>
                  <p className="text-xs text-gray-500">11 5564 6135</p>
                </div>
              </a>

              <a
                href="mailto:hola@guia-atmosfericos.com"
                className="flex items-center gap-3 text-gray-600 hover:text-[#1c2e39] transition-colors duration-200 group"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-xs text-gray-500">
                    hola@guia-atmosfericos.com
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Call to action */}
      <div className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#1c2e39] to-[#2a3f5a] rounded-2xl p-6 text-center">
            <h3 className="text-xl font-bold text-white mb-2">
              ¿Necesitás un servicio de desagote?
            </h3>
            <p className="text-gray-200 mb-4 text-sm">
              Encontrá empresas confiables cerca de tu ubicación
            </p>
            <Link
              href="/empresas"
              className="inline-flex items-center gap-2 bg-white text-[#1c2e39] px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Buscar Empresas
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* Copyright - Estilo simple */}
      <div className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-600">
            <p>
              © {currentYear} Guía de Camiones Atmosféricos. Todos los derechos
              reservados.
            </p>
            <p className="mt-1">
              <a
                href="https://tfmcode.com.ar/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1c2e39] hover:underline font-medium"
              >
                TFM Code Soluciones Integrales
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
