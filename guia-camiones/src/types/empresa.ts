// src/types/empresa.ts - ACTUALIZADO
import type { Servicio } from "./servicio";

export interface Empresa {
  id: number;
  nombre: string;
  slug: string;
  email?: string;
  telefono: string;
  direccion: string;
  provincia?: string;
  localidad?: string;
  servicios?: Servicio[];
  imagenes: string[];
  destacado: boolean;
  habilitado: boolean;
  web?: string;
  corrientes_de_residuos?: string;
  usuarioId?: number | null;
  creado_en?: string;
  // ✅ AGREGADO: Coordenadas para geocodificación
  lat?: number | null;
  lng?: number | null;
}

export interface EmpresaInput {
  nombre: string;
  email?: string;
  telefono: string;
  direccion: string;
  provincia?: string;
  localidad?: string;
  servicios?: number[];
  imagenes: string[];
  destacado: boolean;
  habilitado: boolean;
  web?: string;
  corrientes_de_residuos?: string;
  // ✅ AGREGADO: Coordenadas opcionales para input
  lat?: number | null;
  lng?: number | null;
}

// ✅ AGREGADO: Tipo específico para empresas con coordenadas y distancia
export interface EmpresaWithCoords extends Empresa {
  distancia?: number;
  distanciaTexto?: string;
}
