"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth"; // ✅ Importar el hook

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { checkAuth } = useAuth(); // ✅ Obtener la función checkAuth

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      setLoading(false);

      if (!res.ok) {
        try {
          const data = await res.json();
          setError(data.mensaje || "Credenciales inválidas");
        } catch {
          setError("Error al procesar la respuesta del servidor");
        }
        return;
      }

      const { usuario } = await res.json();

      // ✅ Actualizar el estado del AuthContext después del login exitoso
      checkAuth();

      // Redirigir según el rol
      if (usuario?.rol === "ADMIN") {
        router.push("/panel/admin");
      } else if (usuario?.rol === "EMPRESA") {
        router.push("/panel/empresa");
      } else {
        router.push("/");
      }
    } catch {
      setLoading(false);
      setError("Error inesperado. Intentá de nuevo.");
    }
  };

  return (
    <div className="flex items-center justify-center bg-[#f6f8fb] px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-4 sm:p-6 space-y-6"
      >
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-[#172a56]">
            Iniciar sesión
          </h2>
          <p className="text-sm sm:text-base text-zinc-500 mt-1">
            Accedé a tu panel de empresa o administración
          </p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded text-sm text-center">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#172a56] text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#172a56] text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full font-semibold py-2.5 rounded-md shadow-sm text-sm transition-all ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#172a56] text-white hover:bg-[#101d3e]"
          }`}
        >
          {loading ? "Cargando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
};

export default Login;
