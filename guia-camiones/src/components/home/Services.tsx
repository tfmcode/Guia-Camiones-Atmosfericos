const Services = () => {
  return (
    <section className="relative bg-white py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Divider superior decorativo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-rose-600 rounded-full"></div>

      <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 text-center mb-14">
        Servicios Más Demandados
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Servicio 1 */}
        <div className="rounded-xl p-6 bg-rose-50 hover:bg-rose-100 transition duration-300 shadow-sm hover:shadow-md border border-rose-100">
          <h3 className="text-xl font-bold text-rose-700 mb-2">
            Limpieza de Pozos Negros
          </h3>
          <p className="text-gray-600">
            Servicio de vaciado completo mediante succión de alta potencia,
            eliminando lodos y residuos acumulados. Incluye limpieza y
            desinfección de las paredes del pozo para prevenir olores.
          </p>
        </div>

        {/* Servicio 2 */}
        <div className="rounded-xl p-6 bg-rose-50 hover:bg-rose-100 transition duration-300 shadow-sm hover:shadow-md border border-rose-100">
          <h3 className="text-xl font-bold text-rose-700 mb-2">
            Desobstrucción de Cañerías
          </h3>
          <p className="text-gray-600">
            Eliminación de bloqueos en sistemas de drenaje utilizando equipos
            hidrojet de alta presión que restablecen el flujo normal sin dañar
            las tuberías existentes.
          </p>
        </div>

        {/* Servicio 3 */}
        <div className="rounded-xl p-6 bg-rose-50 hover:bg-rose-100 transition duration-300 shadow-sm hover:shadow-md border border-rose-100">
          <h3 className="text-xl font-bold text-rose-700 mb-2">
            Mantenimiento Preventivo
          </h3>
          <p className="text-gray-600">
            Programas regulares de inspección y limpieza para comunidades de
            vecinos, empresas e instituciones, previniendo emergencias y
            prolongando la vida útil de los sistemas.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Services;
