import { Suspense } from "react";
import EmpresasContent from "@/components/empresas/EmpresasContent";

export default function EmpresasPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">Cargando...</div>}>
      <EmpresasContent />
    </Suspense>
  );
}
