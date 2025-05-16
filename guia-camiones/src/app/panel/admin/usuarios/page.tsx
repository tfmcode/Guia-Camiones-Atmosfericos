"use client";

import { useState } from "react";

type Usuario = {
  id: number;
  nombre: string;
  email: string;
  rol: "admin";
};

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([
    { id: 1, nombre: "Admin Principal", email: "admin@guia.com", rol: "admin" },
    { id: 2, nombre: "Soporte", email: "soporte@guia.com", rol: "admin" },
  ]);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");

  const handleAgregar = () => {
    if (!nombre || !email) return alert("Completá los campos");

    const nuevo: Usuario = {
      id: Date.now(),
      nombre,
      email,
      rol: "admin",
    };

    setUsuarios((prev) => [...prev, nuevo]);
    setNombre("");
    setEmail("");
  };

  const eliminarUsuario = (id: number) => {
    if (confirm("¿Eliminar este administrador?")) {
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Administradores del sistema</h1>

      <div className="bg-gray-50 p-4 rounded border space-y-2">
        <h2 className="text-lg font-semibold">Agregar nuevo administrador</h2>
        <div className="flex flex-col md:flex-row gap-2">
          <input
            type="text"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <button
            onClick={handleAgregar}
            className="bg-cyan-700 text-white px-4 py-2 rounded hover:bg-cyan-800 transition"
          >
            Agregar
          </button>
        </div>
      </div>

      <table className="w-full border text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-2">Nombre</th>
            <th className="p-2">Email</th>
            <th className="p-2 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="p-2">{u.nombre}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2 text-right">
                <button
                  onClick={() => eliminarUsuario(u.id)}
                  className="text-red-600 text-sm hover:underline"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
