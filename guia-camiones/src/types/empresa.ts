export interface Empresa {
  id: number;
  slug: string; // ← esta propiedad es clave para rutas amigables como /empresas/destapaciones-zona-sur
  nombre: string;
  email?: string;
  telefono: string;
  direccion: string;
  provincia?: string;
  localidad?: string;
  servicios: string[];
  imagenes: string[];
  destacado: boolean;
  habilitado: boolean;
  fechaCreacion: string;
  usuarioId: number;
}

export type EmpresaInput = Omit<Empresa, "id" | "fechaCreacion" | "slug">;
