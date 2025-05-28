export interface Empresa {
  id: number;
  nombre: string;
  slug: string; 
  email?: string;
  telefono: string;
  direccion: string;
  provincia?: string;
  localidad?: string;
  destacado: boolean;
  habilitado: boolean;
  creadoEn: string;
  web?: string;
  imagenes: string[];
  servicios: string[];
}

export type EmpresaInput = Omit<Empresa, "id" | "creadoEn">;
