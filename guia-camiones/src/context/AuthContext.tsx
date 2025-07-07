"use client";

import { createContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Usuario, Empresa } from "@/types";

type AuthContextType = {
  usuario: Usuario | null;
  empresa: Empresa | null;
  loading: boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  empresa: null,
  loading: true,
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          console.warn("No autorizado o error al obtener usuario");
          throw new Error("No autorizado");
        }

        const { usuario } = await res.json();
        console.log("usuario cargado:", usuario);
        setUsuario(usuario);

        if (usuario.rol === "EMPRESA") {
          const empresaRes = await fetch("/api/empresa/me", {
            method: "GET",
            credentials: "include",
          });

          if (!empresaRes.ok) {
            console.warn("No se pudo cargar empresa para EMPRESA");
            throw new Error("Error cargando empresa");
          }

          const data = await empresaRes.json();
          console.log("empresa cargada:", data.empresa);
          setEmpresa(data.empresa);
        } else {
          setEmpresa(null);
        }
      } catch (error) {
        console.error("Error en fetchUsuario AuthContext:", error);
        setUsuario(null);
        setEmpresa(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUsuario();
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.error("Error al cerrar sesión:", e);
    }
    setUsuario(null);
    setEmpresa(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ usuario, empresa, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
