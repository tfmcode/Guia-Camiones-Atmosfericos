"use client";

import React from "react";
import Image from "next/image";

const WhatsappFloating: React.FC = () => {
  const phone = "5491155646135";
  const message = "Hola! Estoy viendo su web y quiero hacer una consulta.";

  const href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  const handleClick = () => {
    if (typeof window !== "undefined" && window.dataLayer) {
      window.dataLayer.push({
        event: "whatsapp_click",
        link_url: href,
        location: "floating_button",
      });
    }
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="Chatear por WhatsApp"
      aria-label="Abrir conversación por WhatsApp"
      className="fixed bottom-4 right-4 z-50"
      onClick={handleClick}
    >
      <Image
        src="/WhatsApp.svg"
        alt="WhatsApp"
        width={75}
        height={75}
        className="hover:scale-105 transition-all drop-shadow-xl"
        priority
      />
    </a>
  );
};

export default WhatsappFloating;
