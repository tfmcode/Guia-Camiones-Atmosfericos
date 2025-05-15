"use client";

import Link from "next/link";
import type { Empresa } from "@/types/empresa";

interface Props {
  empresa: Empresa;
}

const EmpresaCard = ({ empresa }: Props) => {
  return (
    <Link
      href={`/empresas/${empresa.slug}`}
      className="block border rounded p-4 shadow-sm bg-white hover:shadow-md transition hover:ring-1 hover:ring-blue-500"
    >
      <h2 className="text-lg font-semibold text-blue-700 hover:underline">
        {empresa.nombre}
      </h2>
      <p className="text-sm text-gray-600 mb-1">
        {empresa.provincia || "-"} — {empresa.localidad || "-"}
      </p>
      <p className="text-sm mb-2 text-gray-700">
        {empresa.servicios?.join(", ") || "Sin servicios"}
      </p>
      {empresa.destacado && (
        <span className="inline-block text-xs text-white bg-yellow-500 px-2 py-1 rounded">
          DESTACADA
        </span>
      )}
    </Link>
  );
};

export default EmpresaCard;
