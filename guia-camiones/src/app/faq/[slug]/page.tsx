import { notFound } from "next/navigation";
import Link from "next/link";

const faqs: Record<
  string,
  {
    titulo: string;
    contenido: string;
  }
> = {
  "servicio-cuando-solicitarlo": {
    titulo: "Sobre el Servicio y Cuándo Solicitarlo",
    contenido: `
¿Cuándo debo llamar a un camión atmosférico?

Debe llamar a un camión atmosférico cuando experimente problemas como:
- Desbordamiento de pozos ciegos o cámaras sépticas.
- Malos olores persistentes provenientes de desagües o sistemas sépticos.
- Lentitud o bloqueo en el drenaje de inodoros, duchas o lavabos.
- Acumulación de líquidos en áreas donde no debería haberlos.
- Mantenimiento preventivo programado de su pozo ciego o cámara séptica.
- Necesidad de vaciar tanques de retención o depósitos de aguas residuales.

¿Qué tipo de líquidos o residuos pueden succionar los camiones atmosféricos?

- Aguas residuales domésticas (negras y grises)
- Lodos de pozos ciegos y cámaras sépticas
- Grasas y aceites de drenajes
- Líquidos industriales no peligrosos (previa habilitación)

¿Con qué frecuencia debo vaciar mi pozo ciego/cámara séptica?

**Empresas y restaurantes**: cada 3 a 6 meses o incluso más frecuente si hay alta producción de residuos grasos.

**Pozos domiciliarios**: cada 1 a 3 años, o cada 3 a 5 años para cámaras sépticas, según número de habitantes y uso.

**Factores adicionales**:
- Tamaño de la cámara o trampa.
- Normativas locales.
- Tipo y cantidad de residuos.
- Diseño y mantenimiento del sistema.

**Recomendación general para restaurantes**:
- 3 a 6 meses como frecuencia base.
- Mensual o quincenal para locales con alto volumen de frituras y grasas.

¿Cuánto tiempo tarda el servicio?

Entre 30 minutos y 2 horas, según volumen y accesibilidad.

¿Necesito estar presente?

Se recomienda que sí, pero no es estrictamente necesario si se brinda acceso claro y seguro.`,
  },

  "normativas-y-seguridad": {
    titulo: "Normativas y Seguridad",
    contenido: `
¿Qué normativas deben cumplir estos servicios?

- Disposición final en plantas autorizadas.
- Habilitaciones vigentes para empresa y vehículos.
- Uso de EPP y cumplimiento de protocolos de higiene.
- Registro de manifiestos de residuos.
- Control de derrames, olores y ruidos.

¿Son seguros los camiones atmosféricos?

Sí, si son operados por empresas serias y personal capacitado. Se deben evitar gases tóxicos y manejar correctamente los líquidos para prevenir accidentes.`,
  },

  "costos-y-presupuestos": {
    titulo: "Costos y Presupuestos",
    contenido: `
¿Cómo se determina el precio del servicio?

- Volumen a succionar (m³ o capacidad del camión).
- Distancia al domicilio.
- Complejidad del acceso o del trabajo.
- Horarios fuera de jornada laboral (pueden tener recargo).
- Tipo de residuo.

¿Ofrecen presupuestos sin cargo?

Sí, la mayoría de las empresas ofrecen presupuestos gratuitos, especialmente para trabajos planificados.

¿Aceptan diferentes métodos de pago?

Generalmente sí: efectivo, transferencia y en algunos casos tarjetas de débito o crédito.`,
  },

  "mantenimiento-y-prevencion": {
    titulo: "Mantenimiento y Prevención",
    contenido: `
¿Qué puedo hacer para prolongar la vida útil de mi sistema?

- No tirar toallitas, aceites, pañales ni productos no biodegradables.
- Usar productos de limpieza ecológicos.
- Vaciar periódicamente según uso y cantidad de personas.
- Instalar trampas de grasa si es comercio gastronómico.

¿Qué hago si mi pozo está desbordado?

- Evitar el contacto con el agua contaminada.
- Restringir el uso de desagües.
- Llamar inmediatamente a una empresa especializada.`,
  },

  "empresa-y-flota": {
    titulo: "Sobre la Empresa y la Flota",
    contenido: `
¿Están habilitados sus camiones y el personal?

Las empresas serias deben contar con:
- Habilitaciones municipales, provinciales y/o nacionales.
- Camiones registrados y controlados.
- Personal capacitado con documentación y cursos vigentes.

¿Qué tamaño de camiones tienen?

Varía: 8m³, 10m³, 12m³ o más, según la necesidad del servicio.

¿Ofrecen servicios de emergencia?

Sí, muchas empresas ofrecen atención 24/7 ante desbordes o urgencias graves.`,
  },
};

export async function generateStaticParams() {
  return Object.keys(faqs).map((slug) => ({ slug }));
}

export default async function FaqDetalle({
  params: paramsPromise,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await paramsPromise;
  const contenido = faqs[slug];

  if (!contenido) return notFound();

  return (
    <main className="max-w-3xl mx-auto py-20 px-6 sm:px-8 lg:px-10 text-[#1c2e39]">
      <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-10 tracking-tight text-center border-b border-[#1c2e39]/20 pb-6">
        {contenido.titulo}
      </h1>

      <div className="space-y-6 text-lg leading-relaxed text-gray-800">
        {contenido.contenido.split("\n").map((linea, i) => {
          const texto = linea.trim();

          if (!texto) return null;

          if (texto.startsWith("-")) {
            return (
              <ul
                key={i}
                className="list-disc pl-6 text-base text-gray-700 space-y-2"
              >
                <li className="marker:text-[#1c2e39]">
                  {texto.slice(1).trim()}
                </li>
              </ul>
            );
          }

          if (texto.endsWith("?")) {
            return (
              <h2
                key={i}
                className="text-xl font-semibold text-[#1c2e39] mt-8 mb-2 border-l-4 border-[#1c2e39] pl-4"
              >
                {texto}
              </h2>
            );
          }

          // ✅ Línea normal: renderizar como párrafo
          return (
            <p key={i} className="text-base text-gray-700">
              {texto}
            </p>
          );
        })}
      </div>

      <div className="mt-12 flex justify-center">
        <Link
          href="/#faq"
          className="inline-flex items-center gap-2 bg-[#1c2e39] text-white font-semibold px-6 py-3 rounded-full shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105"
        >
          ← Volver a las preguntas
        </Link>
      </div>
    </main>
  );
}
