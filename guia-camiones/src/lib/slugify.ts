export function generarSlug(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')                    // elimina acentos
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')               // espacios → guiones
    .replace(/[^a-z0-9\-]/g, '')        // caracteres especiales
    .replace(/\-+/g, '-')               // múltiples guiones → uno
    .replace(/^-+|-+$/g, '');           // guiones al inicio/fin
}
