"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
  children: React.ReactNode;
  allowedRoles?: ("ADMIN" | "EMPRESA" | "USUARIO")[];
};

const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const { usuario, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!usuario) {
        router.push("/login");
      } else if (allowedRoles && !allowedRoles.includes(usuario.rol)) {
        router.push("/unauthorized");
      }
    }
  }, [usuario, loading, allowedRoles, router]);

  if (loading || !usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Cargando...
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
