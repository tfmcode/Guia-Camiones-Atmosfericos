"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [rol, setRol] = useState<"empresa" | "admin">("empresa");

  const handleLogin = () => {
    const mockUser = {
      id: 1,
      nombre: rol === "empresa" ? "Empresa Test" : "Admin Principal",
      email,
      rol,
    };

    login(mockUser);

    if (rol === "empresa") {
      router.push("/panel/empresa");
    } else {
      router.push("/panel/admin");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-6 bg-white rounded shadow mt-12">
      <h1 className="text-2xl font-bold text-center">Iniciar Sesión</h1>

      <div className="space-y-4">
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border rounded p-2 w-full"
        />

        <div className="space-x-4">
          <label className="text-sm">
            <input
              type="radio"
              value="empresa"
              checked={rol === "empresa"}
              onChange={() => setRol("empresa")}
              className="mr-2"
            />
            Ingresar como Empresa
          </label>
          <label className="text-sm">
            <input
              type="radio"
              value="admin"
              checked={rol === "admin"}
              onChange={() => setRol("admin")}
              className="mr-2"
            />
            Ingresar como Admin
          </label>
        </div>

        <button
          onClick={handleLogin}
          className="bg-cyan-700 text-white px-4 py-2 rounded w-full hover:bg-cyan-800 transition"
        >
          Ingresar
        </button>
      </div>
    </div>
  );
}
