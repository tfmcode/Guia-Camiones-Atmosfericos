import { MonitorPlay, Landmark, UserPlus, Settings2 } from "lucide-react";

const Features = () => {
  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 text-center mb-12">
       BUSCADOR DE EMPRESAS Y SERVICIOS
      </h2>

      <p className="text-center text-gray-700 font-semibold uppercase tracking-wide mb-12">
        Adquiera nuestros servicios
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Bloque 1 */}
        <div className="flex items-start gap-4 bg-white p-5 rounded-lg shadow-sm hover:shadow-md hover:-translate-y-1 transition duration-300">
          <div className="bg-red-100 text-red-600 p-3 rounded-lg">
            <MonitorPlay className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Guía de operadores de residuos
            </h3>
            <p className="text-gray-600">
              Accedé al listado de empresas dedicadas a la gestión y recolección
              de residuos líquidos, fosas sépticas y pozos ciegos.
            </p>
          </div>
        </div>

        {/* Bloque 2 */}
        <div className="flex items-start gap-4 bg-white p-5 rounded-lg shadow-sm hover:shadow-md hover:-translate-y-1 transition duration-300">
          <div className="bg-red-100 text-red-600 p-3 rounded-lg">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Guía de proveedores
            </h3>
            <p className="text-gray-600">
              Encontrá fabricantes y distribuidores de insumos, equipos
              atmosféricos, repuestos y más para tu actividad.
            </p>
          </div>
        </div>

        {/* Bloque 3 */}
        <div className="flex items-start gap-4 bg-white p-5 rounded-lg shadow-sm hover:shadow-md hover:-translate-y-1 transition duration-300">
          <div className="bg-red-100 text-red-600 p-3 rounded-lg">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Registre gratis su empresa
            </h3>
            <p className="text-gray-600">
              Sumá tu empresa a la guía para aumentar tu visibilidad y recibir
              consultas sin intermediarios.
            </p>
          </div>
        </div>

        {/* Bloque 4 */}
        <div className="flex items-start gap-4 bg-white p-5 rounded-lg shadow-sm hover:shadow-md hover:-translate-y-1 transition duration-300">
          <div className="bg-red-100 text-red-600 p-3 rounded-lg">
            <Settings2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Publique un anuncio destacado
            </h3>
            <p className="text-gray-600">
              Posicioná tu empresa entre los primeros resultados y destacate con
              mayor exposición frente a la competencia.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
