"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const preguntas = [
  {
    pregunta: "¿Cuándo debo llamar a un camión atmosférico?",
    respuesta:
      "Cuando tenés pozos negros llenos, olores fuertes o sistemas de drenaje lentos. También como mantenimiento preventivo cada cierto tiempo.",
  },
  {
    pregunta: "¿Qué normativas deben cumplir estos servicios?",
    respuesta:
      "Los servicios deben cumplir con regulaciones ambientales locales y estar habilitados por entes municipales o provinciales.",
  },
  {
    pregunta: "¿Cómo se determina el precio del servicio?",
    respuesta:
      "El precio varía según la distancia, el volumen a retirar, el tipo de residuo y la urgencia del servicio (por ejemplo, atención 24h).",
  },
];

const Faq = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-zinc-900 text-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12">
          Preguntas Frecuentes
        </h2>

        <div className="space-y-6">
          {preguntas.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-zinc-800 border border-zinc-700 rounded-lg transition-shadow hover:shadow-md"
              >
                <button
                  onClick={() => toggle(index)}
                  className="w-full flex justify-between items-center p-5 text-left text-lg font-semibold text-white focus:outline-none"
                >
                  <span>{item.pregunta}</span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-rose-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-rose-500" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-gray-300 text-base transition-all duration-300">
                    {item.respuesta}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Faq;
