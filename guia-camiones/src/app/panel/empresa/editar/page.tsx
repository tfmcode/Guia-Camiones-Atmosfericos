"use client";

import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import Image from "next/image";

export default function EditarEmpresaPage() {
  const { user } = useAuth();

  const [nombre, setNombre] = useState(user?.nombre || "");
  const [email, setEmail] = useState(user?.email || "");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [provincia, setProvincia] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [servicios, setServicios] = useState("");
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [preview, setPreview] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const datos = {
      nombre,
      email,
      telefono,
      direccion,
      provincia,
      localidad,
      servicios: servicios.split(",").map((s) => s.trim()),
      imagenes,
    };
    console.log("✅ Datos enviados:", datos);
    // Aquí iría el llamado al backend para actualizar los datos
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagenes((prev) => [...prev, result]);
        setPreview(null);
      };
      reader.readAsDataURL(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow space-y-6">
      <h1 className="text-2xl font-bold mb-4">
        Editar Información de la Empresa
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="tel"
          placeholder="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Dirección"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Provincia"
          value={provincia}
          onChange={(e) => setProvincia(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Localidad"
          value={localidad}
          onChange={(e) => setLocalidad(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <textarea
          placeholder="Servicios ofrecidos (separados por coma)"
          value={servicios}
          onChange={(e) => setServicios(e.target.value)}
          className="w-full border p-2 rounded h-24"
        />

        <button
          type="submit"
          className="bg-cyan-700 text-white px-4 py-2 rounded hover:bg-cyan-800 transition"
        >
          Guardar Cambios
        </button>
      </form>

      {/* Sección de imágenes */}
      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold">Imágenes de la empresa</h2>

        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="block w-full text-sm text-gray-700"
        />

        {preview && (
          <div className="mt-2 relative w-full h-32 rounded overflow-hidden border">
            <Image
              src={preview}
              alt="Vista previa"
              fill
              className="object-cover"
            />
          </div>
        )}

        {imagenes.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {imagenes.map((img, i) => (
              <div
                key={i}
                className="relative w-full h-32 rounded overflow-hidden border"
              >
                <Image
                  src={img}
                  alt={`img-${i}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
