// src/constants/barrios.ts

/**
 * Listado completo de los 48 barrios oficiales de la Ciudad Autónoma de Buenos Aires (CABA)
 * Ordenados alfabéticamente para mejor UX
 */
export const BARRIOS_CABA = [
  "Agronomía",
  "Almagro",
  "Balvanera",
  "Barracas",
  "Belgrano",
  "Boedo",
  "Caballito",
  "Chacarita",
  "Coghlan",
  "Colegiales",
  "Constitución",
  "Flores",
  "Floresta",
  "La Boca",
  "La Paternal",
  "Liniers",
  "Mataderos",
  "Monserrat",
  "Monte Castro",
  "Nueva Pompeya",
  "Núñez",
  "Palermo",
  "Parque Avellaneda",
  "Parque Chacabuco",
  "Parque Chas",
  "Parque Patricios",
  "Puerto Madero",
  "Recoleta",
  "Retiro",
  "Saavedra",
  "San Cristóbal",
  "San Nicolás",
  "San Telmo",
  "Vélez Sársfield",
  "Versalles",
  "Villa Crespo",
  "Villa del Parque",
  "Villa Devoto",
  "Villa General Mitre",
  "Villa Lugano",
  "Villa Luro",
  "Villa Ortúzar",
  "Villa Pueyrredón",
  "Villa Real",
  "Villa Riachuelo",
  "Villa Santa Rita",
  "Villa Soldati",
  "Villa Urquiza",
] as const;

/**
 * Nombres alternativos que puede tener CABA en diferentes APIs
 * o formularios para detectar correctamente la provincia
 */
export const NOMBRES_CABA = [
  "Ciudad Autónoma de Buenos Aires",
  "CABA",
  "Capital Federal",
  "Buenos Aires Capital",
  "Ciudad de Buenos Aires",
  "C.A.B.A.",
  "Cdad. Autónoma de Buenos Aires",
] as const;

/**
 * Función helper para detectar si una provincia corresponde a CABA
 */
export const esCaba = (provincia: string): boolean => {
  if (!provincia) return false;

  const provinciaLower = provincia.toLowerCase().trim();

  return NOMBRES_CABA.some(
    (nombre) =>
      provinciaLower.includes(nombre.toLowerCase()) ||
      nombre.toLowerCase().includes(provinciaLower)
  );
};

/**
 * Función para formatear barrios como objetos con id y nombre
 * Compatible con el formato que espera tu componente
 */
export const getBarriosFormateados = () => {
  return BARRIOS_CABA.map((barrio) => ({
    id: barrio
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, ""),
    nombre: barrio,
  }));
};

/**
 * Barrios más populares para mostrar primero en algún select especial
 * (opcional, por si querés destacar algunos)
 */
export const BARRIOS_POPULARES = [
  "Palermo",
  "Recoleta",
  "Puerto Madero",
  "Belgrano",
  "Villa Crespo",
  "Caballito",
  "San Telmo",
  "La Boca",
  "Núñez",
  "Almagro",
] as const;
