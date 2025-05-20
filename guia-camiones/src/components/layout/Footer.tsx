const Footer = () => {
  return (
    <footer className="bg-white mt-12">
      <div className="mx-auto max-w-screen-xl space-y-8 px-4 py-16 sm:px-6 lg:space-y-16 lg:px-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="text-cyan-700 font-bold text-lg flex items-center gap-2">
            🚛 Camiones Atmosfericos
          </div>

          <ul className="mt-8 flex justify-start gap-6 sm:mt-0 sm:justify-end">
            {["Facebook", "Instagram", "Twitter"].map(
              (platform) => (
                <li key={platform}>
                  <a
                    href="#"
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-700 transition hover:opacity-75"
                  >
                    <span className="sr-only">{platform}</span>
                    <svg
                      className="size-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  </a>
                </li>
              )
            )}
          </ul>
        </div>

        <div className="grid grid-cols-1 gap-8 border-t border-gray-100 pt-8 sm:grid-cols-2 lg:grid-cols-4 lg:pt-16">
          {[
            {
              title: "Servicios",
              items: ["SEO", "Consultoría", "Soporte", "Promociones", "Turnos"],
            },
      
            {
              title: "Ayuda",
              items: ["Contacto", "Preguntas frecuentes", "Chat en vivo"],
            },
            {
              title: "Legal",
              items: ["Términos", "Política de Privacidad", "Cookies"],
            },
          ].map((section) => (
            <div key={section.title}>
              <p className="font-medium text-gray-900">{section.title}</p>
              <ul className="mt-6 space-y-4 text-sm">
                {section.items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-gray-700 transition hover:opacity-75"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 text-center">
          &copy; {new Date().getFullYear()} Guía de Camiones Atmosféricos. Todos
          los derechos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
