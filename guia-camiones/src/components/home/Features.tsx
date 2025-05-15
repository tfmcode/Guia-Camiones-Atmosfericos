import { MapPin, Filter, Phone } from "lucide-react";

const Features = () => {
  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 text-center mb-12">
        Buscador de Empresas y Camioneros
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="flex items-start gap-4">
          <div className="bg-violet-100 text-violet-700 p-3 rounded-lg">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Búsqueda por Ubicación
            </h3>
            <p className="text-gray-600">
              Localizá servicios disponibles en tu ciudad o localidad con solo
              ingresar tu código postal o provincia, mostrando los proveedores
              más cercanos a tu domicilio.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="bg-violet-100 text-violet-700 p-3 rounded-lg">
            <Filter className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Filtros Avanzados
            </h3>
            <p className="text-gray-600">
              Refiná tu búsqueda por tipo de servicio específico, disponibilidad
              de emergencia 24h, capacidad del tanque y valoraciones de otros
              usuarios.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="bg-violet-100 text-violet-700 p-3 rounded-lg">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Contacto Directo
            </h3>
            <p className="text-gray-600">
              Accedé a teléfonos, WhatsApp y horarios de atención verificados
              para comunicarte inmediatamente con los proveedores que mejor se
              adapten a tus necesidades.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
