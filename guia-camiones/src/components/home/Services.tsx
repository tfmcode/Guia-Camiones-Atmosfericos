const Services = () => {
  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 text-center mb-12">
        Servicios Más Demandados
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-violet-100 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Limpieza de Pozos Negros
          </h3>
          <p className="text-gray-700">
            Servicio de vaciado completo mediante succión de alta potencia,
            eliminando lodos y residuos acumulados. Incluye limpieza y
            desinfección de las paredes del pozo para prevenir olores.
          </p>
        </div>

        <div className="bg-violet-100 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Desobstrucción de Cañerías
          </h3>
          <p className="text-gray-700">
            Eliminación de bloqueos en sistemas de drenaje utilizando equipos
            hidrojet de alta presión que restablecen el flujo normal sin dañar
            las tuberías existentes.
          </p>
        </div>

        <div className="bg-violet-100 p-6 rounded-lg md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Mantenimiento Preventivo
          </h3>
          <p className="text-gray-700">
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
