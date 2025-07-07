// types/servicio.ts

export interface Servicio {
  id: number;
  nombre: string;
}

// ⚠️ ServicioInput NO DEBE SER Servicio[]
// Si usás ServicioInput para creación, debería ser:
export interface ServicioInput {
  nombre: string;
}

// O si no lo usás, podés eliminar ServicioInput.
