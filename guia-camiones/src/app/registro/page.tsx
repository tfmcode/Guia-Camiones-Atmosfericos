"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function RegistroEmpresa() {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await axios.post("/api/registro", form);
      alert("Empresa registrada exitosamente. Ahora podés iniciar sesión.");
      setForm({
        nombre: "",
        email: "",
        telefono: "",
        password: "",
      });
      router.push("/login");
    } catch (error) {
      console.error("Error al registrar la empresa:", error);

      if (typeof error === "object" && error !== null && "response" in error) {
        const mensaje = (
          error as { response?: { data?: { mensaje?: string } } }
        ).response?.data?.mensaje;
        setError(mensaje || "Error inesperado. Intentá de nuevo.");
      } else {
        setError("Error inesperado. Intentá de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold mb-8 text-center text-[#1c2e39]">
        Registrá tu Empresa
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-8 rounded-xl shadow-md border border-[#1c2e39]/10"
      >
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded text-sm text-center">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold mb-1 text-[#1c2e39]">
            Nombre de la empresa
          </label>
          <input
            type="text"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 text-[#1c2e39]">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 text-[#1c2e39]">
            Teléfono
          </label>
          <input
            type="text"
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 text-[#1c2e39]">
            Contraseña
          </label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            autoComplete="new-password"
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            ℹ️ Después de registrarte, podrás completar informacion adicional sobre
            tu empresa desde el panel de control.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full font-semibold py-3 px-6 rounded-lg shadow transition duration-300 ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#1c2e39] text-white hover:scale-105 hover:shadow-lg"
          }`}
        >
          {loading ? "Registrando..." : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
}
