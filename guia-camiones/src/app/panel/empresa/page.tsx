export default function EmpresaDashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Bienvenido al Panel de Empresa</h1>
      <p className="text-gray-700">
        Desde aquí vas a poder gestionar la información de tu empresa publicada
        en la guía.
      </p>

      <ul className="list-disc list-inside text-gray-600">
        <li>Editar datos de contacto</li>
        <li>Actualizar servicios y horarios</li>
        <li>Cargar imágenes</li>
        <li>Visualizar estado de publicación</li>
      </ul>
    </div>
  );
}
