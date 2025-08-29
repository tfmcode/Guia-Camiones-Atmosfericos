"use client";

import { createContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Usuario, Empresa } from "@/types";

type AuthContextType = {
  usuario: Usuario | null;
  empresa: Empresa | null;
  loading: boolean;
  logout: () => void;
  checkAuth: () => void;
  refreshEmpresa: () => void; // ✅ Nueva función para refrescar datos de empresa
};

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  empresa: null,
  loading: false,
  logout: () => {},
  checkAuth: () => {},
  refreshEmpresa: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  // Determinar si estamos en una ruta que requiere autenticación
  const isPrivateRoute = pathname.startsWith("/panel");
  const isAuthRoute = pathname === "/login" || pathname === "/registro";

  const fetchEmpresa = async () => {
    try {
      const empresaRes = await fetch("/api/empresa/me", {
        method: "GET",
        credentials: "include",
      });

      if (!empresaRes.ok) {
        console.warn("No se pudo cargar empresa para usuario EMPRESA");
        setEmpresa(null);
        return;
      }

      const data = await empresaRes.json();
      console.log("Empresa cargada:", data.empresa);
      setEmpresa(data.empresa);
    } catch (error) {
      console.error("Error al cargar empresa:", error);
      setEmpresa(null);
    }
  };

  const fetchUsuario = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        if (!isPrivateRoute) {
          console.log("Usuario no autenticado en ruta pública - OK");
        } else {
          console.warn("No autorizado en ruta privada");
        }
        throw new Error("No autorizado");
      }

      const { usuario } = await res.json();
      console.log("Usuario cargado:", usuario);
      setUsuario(usuario);

      // Cargar empresa solo si es rol EMPRESA
      if (usuario.rol === "EMPRESA") {
        await fetchEmpresa();
      } else {
        setEmpresa(null);
      }
    } catch (error) {
      if (isPrivateRoute) {
        console.error("Error en fetchUsuario AuthContext:", error);
      }
      setUsuario(null);
      setEmpresa(null);
    } finally {
      setLoading(false);
      setHasCheckedAuth(true);
    }
  };

  // ✅ Función separada para refrescar solo los datos de empresa
  const refreshEmpresa = async () => {
    if (usuario && usuario.rol === "EMPRESA") {
      await fetchEmpresa();
    }
  };

  useEffect(() => {
    // Solo verificar auth automáticamente en rutas privadas o de auth
    if (isPrivateRoute || isAuthRoute) {
      if (!hasCheckedAuth) {
        fetchUsuario();
      }
    } else {
      // En rutas públicas, solo marcar como "checkeado" sin hacer request
      setLoading(false);
      setHasCheckedAuth(true);
    }
  }, [pathname, hasCheckedAuth, isPrivateRoute, isAuthRoute]);

  // Función manual para verificar auth (útil para login)
  const checkAuth = () => {
    fetchUsuario();
  };

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
    setHasCheckedAuth(false);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{ usuario, empresa, loading, logout, checkAuth, refreshEmpresa }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
