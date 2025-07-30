"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";

interface Props {
  empresaId: number;
  imagenes: string[];
  onChange: (urls: string[]) => void;
}

export const ImageUploader: React.FC<Props> = ({
  empresaId,
  imagenes,
  onChange,
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const baseURL =
    process.env.NODE_ENV === "production"
      ? "https://guia-atmosfericos.com"
      : "";

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("file", file);
    });

    try {
      const res = await fetch(`/api/empresa/admin/${empresaId}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Error al subir imagen");

      const data = await res.json();
      const nuevasUrls = data.urls as string[];

      onChange([...imagenes, ...nuevasUrls]);
    } catch (error) {
      console.error("Error al subir imagen:", error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleEliminar = (url: string) => {
    onChange(imagenes.filter((img) => img !== url));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {imagenes.map((src) => (
          <div
            key={src}
            className="relative w-32 h-32 border rounded overflow-hidden"
          >
            <Image
              src={`${baseURL}${src}`}
              alt="Imagen empresa"
              fill
              style={{ objectFit: "cover" }}
            />
            <button
              type="button"
              onClick={() => handleEliminar(src)}
              className="absolute top-1 right-1 bg-red-600 text-white text-xs px-1 rounded"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <input
        type="file"
        accept="image/*"
        multiple
        ref={fileInputRef}
        onChange={handleUpload}
        disabled={uploading}
      />

      {uploading && (
        <p className="text-sm text-gray-500">Subiendo imágenes...</p>
      )}
    </div>
  );
};
