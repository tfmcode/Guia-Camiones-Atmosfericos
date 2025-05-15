import type { Empresa } from "@/types/empresa";

export const getEmpresas = async (): Promise<Empresa[]> => {
  return [
    {
      id: 1,
      slug: "camion-atmosferico-norte",
      nombre: "Camión Atmosférico Norte",
      email: "contacto@norte.com",
      telefono: "011-1234-5678",
      direccion: "Av. Siempre Viva 123",
      provincia: "Buenos Aires",
      localidad: "San Isidro",
      servicios: ["Desagote", "Limpieza de pozos", "Urgencias 24h"],
      imagenes: [
        "https://via.placeholder.com/300x200?text=Empresa+1",
        "https://via.placeholder.com/300x200?text=Servicio+1",
      ],
      destacado: true,
      habilitado: true,
      fechaCreacion: "2024-01-10",
      usuarioId: 1,
    },
    {
      id: 2,
      slug: "desagotes-urgentes-zona-sur",
      nombre: "Desagotes Urgentes Zona Sur",
      email: "",
      telefono: "011-9999-8888",
      direccion: "Calle Falsa 456",
      provincia: "Buenos Aires",
      localidad: "Lanús",
      servicios: ["Limpieza de cámaras", "Destapación"],
      imagenes: [
        "https://via.placeholder.com/300x200?text=Empresa+2",
        "https://via.placeholder.com/300x200?text=Unidad+2",
      ],
      destacado: false,
      habilitado: true,
      fechaCreacion: "2024-02-20",
      usuarioId: 2,
    },
  ];
};

export const getEmpresaBySlug = async (
  slug: string
): Promise<Empresa | null> => {
  const empresas = await getEmpresas();
  return empresas.find((e) => e.slug === slug) || null;
};
