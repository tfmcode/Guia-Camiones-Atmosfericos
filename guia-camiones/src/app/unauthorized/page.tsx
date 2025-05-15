"use client";

import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="max-w-xl mx-auto text-center py-20 px-4 space-y-6">
      <h1 className="text-3xl font-bold text-red-600">Acceso no autorizado</h1>
      <p className="text-gray-700">
        No tenés permisos para acceder a esta sección del sitio.
      </p>
      <button
        onClick={() => router.push("/")}
        className="bg-cyan-700 text-white px-4 py-2 rounded hover:bg-cyan-800 transition"
      >
        Volver al inicio
      </button>
    </div>
  );
}
