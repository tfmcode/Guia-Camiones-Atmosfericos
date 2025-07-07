import { Empresa } from "./empresa";

export interface Servicio {
  id: number;
  nombre: string;
  empresas?: Empresa[];
}

export type ServicioInput = Omit<Servicio, "id" | "empresas">;
