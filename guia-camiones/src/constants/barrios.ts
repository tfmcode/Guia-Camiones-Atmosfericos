// src/constants/barrios.ts - CORRECCIÓN COMPLETA

/**
 * Listado completo de los 48 barrios oficiales de CABA
 * Ordenados alfabéticamente
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
  "Villa Riachuola",
  "Villa Santa Rita",
  "Villa Soldati",
  "Villa Urquiza",
] as const;

/**
 * Nombres alternativos que puede tener CABA
 * ✅ CRÍTICO: NO incluir "Buenos Aires" solo, porque puede confundirse con la provincia
 */
export const NOMBRES_CABA = [
  "Ciudad Autónoma de Buenos Aires",
  "CABA",
  "Capital Federal",
  "C.A.B.A.",
  "Cdad. Autónoma de Buenos Aires",
  "Ciudad de Buenos Aires", // ✅ OK porque especifica "Ciudad de"
] as const;

/**
 * ✅ FUNCIÓN CORREGIDA: Detecta CABA sin confundir con provincia Buenos Aires
 */
export const esCaba = (provincia: string): boolean => {
  if (!provincia) return false;

  const provinciaLower = provincia.toLowerCase().trim();

  // ✅ CRÍTICO: Verificar que NO sea solo "Buenos Aires" o "Provincia de Buenos Aires"
  if (
    provinciaLower === "buenos aires" ||
    provinciaLower === "provincia de buenos aires" ||
    provinciaLower === "prov. de buenos aires" ||
    provinciaLower === "bs. as." ||
    provinciaLower === "bs as" ||
    provinciaLower === "buenos aires provincia" ||
    provinciaLower.startsWith("provincia")
  ) {
    console.log(`❌ NO es CABA: "${provincia}" es la provincia`);
    return false;
  }

  // ✅ Verificar coincidencia con nombres de CABA
  const isCaba = NOMBRES_CABA.some((nombre) => {
    const nombreLower = nombre.toLowerCase();
    return (
      provinciaLower.includes(nombreLower) ||
      nombreLower.includes(provinciaLower)
    );
  });

  if (isCaba) {
    console.log(`✅ ES CABA: "${provincia}"`);
  } else {
    console.log(`ℹ️ NO es CABA: "${provincia}"`);
  }

  return isCaba;
};

/**
 * Función para formatear barrios como objetos con id y nombre
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
 * ✅ NUEVA FUNCIÓN: Validar si una provincia es Buenos Aires (provincia, no CABA)
 */
export const esBuenosAiresProvincia = (provincia: string): boolean => {
  if (!provincia) return false;

  const provinciaLower = provincia.toLowerCase().trim();

  // Solo es provincia si es exactamente "Buenos Aires" o variantes de provincia
  const esProvinciaBsAs =
    provinciaLower === "buenos aires" ||
    provinciaLower === "provincia de buenos aires" ||
    provinciaLower === "prov. de buenos aires" ||
    provinciaLower === "bs. as." ||
    provinciaLower === "bs as";

  // Verificar que NO sea CABA
  const noCaba = !esCaba(provincia);

  return esProvinciaBsAs && noCaba;
};

/**
 * Barrios más populares (opcional)
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
