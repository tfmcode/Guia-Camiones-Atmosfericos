export default function AdminDashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Panel de Administración</h1>
      <p className="text-gray-700">
        Desde aquí podés gestionar todas las empresas registradas en la guía.
      </p>

      <ul className="list-disc list-inside text-gray-600">
        <li>Revisar nuevas empresas</li>
        <li>Editar, habilitar o destacar empresas</li>
        <li>Eliminar cuentas inactivas</li>
        <li>Ver estadísticas (próximamente)</li>
      </ul>
    </div>
  );
}
