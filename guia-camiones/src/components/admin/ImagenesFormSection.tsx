// src/components/admin/ImagenesFormSection.tsx
"use client";

import { Eye } from "lucide-react";
import { ImageUploader } from "@/components/ui/ImageUploader";

interface ImagenesFormSectionProps {
  modoEdicion: boolean;
  empresaId: number | null;
  imagenes: string[];
  onChange: (nuevasImagenes: string[]) => void;
}

export default function ImagenesFormSection({
  modoEdicion,
  empresaId,
  imagenes,
  onChange,
}: ImagenesFormSectionProps) {
  return (
    <div className="space-y-4 bg-gray-50 rounded-xl p-6 border border-gray-200">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
          <Eye size={16} className="text-white" />
        </div>
        <div>
          <label className="block text-lg font-semibold text-gray-900">
            Galería de Imágenes
          </label>
          <p className="text-sm text-gray-600">
            La primera imagen será la imagen principal de la empresa
          </p>
        </div>
      </div>

      {modoEdicion && empresaId ? (
        <ImageUploader
          empresaId={empresaId}
          imagenes={imagenes}
          onChange={onChange}
        />
      ) : (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Eye size={32} className="text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">
            Imágenes disponibles después de crear
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Las imágenes se pueden agregar después de crear la empresa
          </p>
        </div>
      )}
    </div>
  );
}
