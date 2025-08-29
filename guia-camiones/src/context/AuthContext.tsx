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
  refreshEmpresa: () => Promise<void>; // ✅ CAMBIO: Retorna Promise para mejor control
};

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  empresa: null,
  loading: false,
  logout: () => {},
  checkAuth: () => {},
  refreshEmpresa: async () => {}, // ✅ CAMBIO: Async en el default
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

  // ✅ CAMBIO PRINCIPAL: Función mejorada para cargar empresa con mejor manejo de errores
  const fetchEmpresa = async (): Promise<Empresa | null> => {
    try {
      console.log("🔄 [AuthContext] Cargando datos de empresa...");

      const empresaRes = await fetch("/api/empresa/me", {
        method: "GET",
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache", // ✅ AGREGADO: Headers anti-caché
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      if (!empresaRes.ok) {
        console.warn(
          "⚠️ [AuthContext] No se pudo cargar empresa para usuario EMPRESA"
        );
        setEmpresa(null);
        return null;
      }

      const data = await empresaRes.json();
      console.log("✅ [AuthContext] Empresa cargada:", data.empresa?.nombre);

      const empresaData = data.empresa;
      setEmpresa(empresaData);
      return empresaData;
    } catch (error) {
      console.error("❌ [AuthContext] Error al cargar empresa:", error);
      setEmpresa(null);
      return null;
    }
  };

  const fetchUsuario = async () => {
    setLoading(true);
    try {
      console.log("🔄 [AuthContext] Verificando autenticación...");

      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache", // ✅ AGREGADO: Headers anti-caché
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      if (!res.ok) {
        if (!isPrivateRoute) {
          console.log(
            "ℹ️ [AuthContext] Usuario no autenticado en ruta pública - OK"
          );
        } else {
          console.warn("⚠️ [AuthContext] No autorizado en ruta privada");
        }
        throw new Error("No autorizado");
      }

      const { usuario } = await res.json();
      console.log(
        "✅ [AuthContext] Usuario cargado:",
        usuario.email,
        "-",
        usuario.rol
      );
      setUsuario(usuario);

      // Cargar empresa solo si es rol EMPRESA
      if (usuario.rol === "EMPRESA") {
        await fetchEmpresa();
      } else {
        setEmpresa(null);
      }
    } catch (error) {
      if (isPrivateRoute) {
        console.error("❌ [AuthContext] Error en fetchUsuario:", error);
      }
      setUsuario(null);
      setEmpresa(null);
    } finally {
      setLoading(false);
      setHasCheckedAuth(true);
    }
  };

  // ✅ CAMBIO PRINCIPAL: Función mejorada para refrescar empresa
  const refreshEmpresa = async (): Promise<void> => {
    if (!usuario || usuario.rol !== "EMPRESA") {
      console.log(
        "ℹ️ [AuthContext] No es usuario EMPRESA, saltando refresh de empresa"
      );
      return;
    }

    try {
      console.log("🔄 [AuthContext] Refrescando datos de empresa...");

      const empresaActualizada = await fetchEmpresa();

      if (empresaActualizada) {
        console.log(
          "✅ [AuthContext] Empresa refrescada exitosamente:",
          empresaActualizada.nombre
        );
        console.log("📊 [AuthContext] Datos actualizados:", {
          id: empresaActualizada.id,
          slug: empresaActualizada.slug,
          servicios: empresaActualizada.servicios?.length || 0,
          imagenes: empresaActualizada.imagenes?.length || 0,
        });
      } else {
        console.warn("⚠️ [AuthContext] No se pudo refrescar la empresa");
      }
    } catch (error) {
      console.error("❌ [AuthContext] Error al refrescar empresa:", error);
      throw error; // ✅ CAMBIO: Re-lanzar el error para que el componente pueda manejarlo
    }
  };

  useEffect(() => {
    // Solo verificar auth automáticamente en rutas privadas o de auth
    if (isPrivateRoute || isAuthRoute) {
      if (!hasCheckedAuth) {
        console.log(
          "🚀 [AuthContext] Iniciando verificación de auth automática"
        );
        fetchUsuario();
      }
    } else {
      // En rutas públicas, solo marcar como "checkeado" sin hacer request
      if (!hasCheckedAuth) {
        console.log("ℹ️ [AuthContext] Ruta pública, marcando como verificada");
        setLoading(false);
        setHasCheckedAuth(true);
      }
    }
  }, [pathname, hasCheckedAuth, isPrivateRoute, isAuthRoute]);

  // ✅ CAMBIO: Función manual para verificar auth (útil para login)
  const checkAuth = () => {
    console.log("🔄 [AuthContext] Verificación manual de auth solicitada");
    setHasCheckedAuth(false); // ✅ CAMBIO: Resetear flag para forzar nueva verificación
    fetchUsuario();
  };

  const logout = async () => {
    try {
      console.log("👋 [AuthContext] Cerrando sesión...");
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      console.log("✅ [AuthContext] Sesión cerrada exitosamente");
    } catch (e) {
      console.error("❌ [AuthContext] Error al cerrar sesión:", e);
    }

    // ✅ CAMBIO: Limpiar estados de forma más robusta
    setUsuario(null);
    setEmpresa(null);
    setHasCheckedAuth(false);
    setLoading(false);

    router.push("/login");
  };

  // ✅ AGREGADO: Debug info en desarrollo
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 [AuthContext] Estado actual:", {
        usuario: usuario?.email || "null",
        empresa: empresa?.nombre || "null",
        loading,
        hasCheckedAuth,
        pathname,
      });
    }
  }, [usuario, empresa, loading, hasCheckedAuth, pathname]);

  return (
    <AuthContext.Provider
      value={{ usuario, empresa, loading, logout, checkAuth, refreshEmpresa }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
