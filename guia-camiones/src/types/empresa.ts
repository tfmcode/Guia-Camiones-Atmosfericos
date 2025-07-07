export interface Empresa {
  id: number;
  nombre: string;
  slug: string; // Se mantiene para mostrar en frontend
  email?: string;
  telefono: string;
  direccion: string;
  provincia?: string;
  localidad?: string;
  servicios?: { id: number; nombre: string }[];
  imagenes: string[];
  destacado: boolean;
  habilitado: boolean;
  web?: string;
  corrientes_de_residuos?: string;
  usuarioId?: number | null;
  creado_en?: string; // Mejor para manejo en frontend
}

export interface EmpresaInput {
  nombre: string;
  email?: string;
  telefono: string;
  direccion: string;
  provincia?: string;
  localidad?: string;
  servicios?: number[]; // IDs de servicios
  imagenes: string[];
  destacado: boolean;
  habilitado: boolean;
  web?: string;
  corrientes_de_residuos?: string;
}
