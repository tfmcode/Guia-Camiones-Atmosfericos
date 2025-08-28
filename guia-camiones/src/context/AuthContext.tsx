"use client";

import { createContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Usuario, Empresa } from "@/types";

type AuthContextType = {
  usuario: Usuario | null;
  empresa: Empresa | null;
  loading: boolean;
  logout: () => void;
  checkAuth: () => void; // ✅ Función para verificar auth manualmente
};

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  empresa: null,
  loading: false, // ✅ Cambio: por defecto false en páginas públicas
  logout: () => {},
  checkAuth: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(false); // ✅ Por defecto false
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  // ✅ Determinar si estamos en una ruta que requiere autenticación
  const isPrivateRoute = pathname.startsWith("/panel");
  const isAuthRoute = pathname === "/login" || pathname === "/registro";

  const fetchUsuario = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        // ✅ En rutas públicas, no es un error
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
        const empresaRes = await fetch("/api/empresa/me", {
          method: "GET",
          credentials: "include",
        });

        if (!empresaRes.ok) {
          console.warn("No se pudo cargar empresa para usuario EMPRESA");
          throw new Error("Error cargando empresa");
        }

        const data = await empresaRes.json();
        console.log("Empresa cargada:", data.empresa);
        setEmpresa(data.empresa);
      } else {
        setEmpresa(null);
      }
    } catch (error) {
      // ✅ Solo loguear error si estamos en ruta privada
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

  useEffect(() => {
    // ✅ Solo verificar auth automáticamente en rutas privadas o de auth
    if (isPrivateRoute || isAuthRoute) {
      if (!hasCheckedAuth) {
        fetchUsuario();
      }
    } else {
      // ✅ En rutas públicas, solo marcar como "checkeado" sin hacer request
      setLoading(false);
      setHasCheckedAuth(true);
    }
  }, [pathname, hasCheckedAuth, isPrivateRoute, isAuthRoute]);

  // ✅ Función manual para verificar auth (útil para login)
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
      value={{ usuario, empresa, loading, logout, checkAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
