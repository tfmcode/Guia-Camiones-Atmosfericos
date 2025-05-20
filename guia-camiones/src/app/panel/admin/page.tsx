
export default function AdminDashboardPage() {
  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-md ring-1 ring-zinc-100 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-800">
          Panel de Administración
        </h1>
      </div>

      <p className="text-zinc-500 text-base leading-relaxed">
        Desde aquí podés gestionar todas las empresas registradas en la guía y
        administrar el contenido de la plataforma.
      </p>

      <ul className="list-disc pl-5 text-zinc-600 space-y-2 text-sm md:text-base">
        <li>✅ Revisar nuevas empresas registradas</li>
        <li>✏️ Editar, habilitar o destacar empresas existentes</li>
        <li>🗑️ Eliminar cuentas inactivas o reportadas</li>
        <li>📊 Ver estadísticas de uso y actividad (próximamente)</li>
      </ul>
    </div>
  );
}
