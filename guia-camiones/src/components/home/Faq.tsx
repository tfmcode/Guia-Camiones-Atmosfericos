"use client";

import { useState } from "react";

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
    <section className="bg-indigo-600 text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-10">
          Preguntas Frecuentes (FAQ)
        </h2>

        <div className="space-y-4">
          {preguntas.map((item, index) => (
            <div key={index} className="border-b border-indigo-400 pb-4">
              <button
                className="flex justify-between items-center w-full text-left text-lg font-medium focus:outline-none"
                onClick={() => toggle(index)}
              >
                <span>{item.pregunta}</span>
                <span className="text-xl">
                  {openIndex === index ? "−" : "+"}
                </span>
              </button>
              {openIndex === index && (
                <p className="mt-3 text-indigo-100 text-base">
                  {item.respuesta}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Faq;
