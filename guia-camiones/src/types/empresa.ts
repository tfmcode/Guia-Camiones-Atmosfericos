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
  servicios?: Servicio[]; // ✅ CAMBIADO de number[] a Servicio[]
  imagenes: string[];
  destacado: boolean;
  habilitado: boolean;
  web?: string;
  corrientes_de_residuos?: string;
  usuarioId?: number | null;
  creado_en?: string;
}

export interface EmpresaInput {
  nombre: string;
  email?: string;
  telefono: string;
  direccion: string;
  provincia?: string;
  localidad?: string;
  servicios?: number[]; // ✅ Para creación/edición sigue siendo number[]
  imagenes: string[];
  destacado: boolean;
  habilitado: boolean;
  web?: string;
  corrientes_de_residuos?: string;
}
