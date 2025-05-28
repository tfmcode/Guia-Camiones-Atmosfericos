"use client";

import { useState } from "react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include", // ← Asegura que guarde las cookies
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Error al iniciar sesión");
        return;
      }

      const { usuario } = await res.json();

      // 🔥 Reemplazamos router.push por una recarga que asegura que el contexto se actualice
      if (usuario?.rol === "ADMIN") {
        window.location.href = "/panel/admin";
      } else if (usuario?.rol === "EMPRESA") {
        window.location.href = "/panel/empresa";
      } else {
        window.location.href = "/";
      }
    } catch {
      setError("Error inesperado. Intentá de nuevo.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-2xl shadow-lg p-10 space-y-6"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold text-zinc-800">Iniciar sesión</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Accedé a tu panel de empresa o administración
          </p>
        </div>

        {error && (
          <div className="bg-rose-100 text-rose-700 px-4 py-2 rounded text-sm text-center">
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
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
            required
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
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-rose-600 text-white font-semibold py-2.5 rounded-md hover:bg-rose-700 transition-all shadow-sm text-sm"
        >
          Entrar
        </button>
      </form>
    </div>
  );
};

export default Login;
