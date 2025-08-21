"use client";

import React, { useRef, useState, useCallback } from "react";
import { Upload, X, Image as ImageIcon, Crop, Check } from "lucide-react";

interface Props {
  empresaId: number;
  imagenes: string[];
  onChange: (urls: string[]) => void;
}

interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ImageUploader: React.FC<Props> = ({
  empresaId,
  imagenes,
  onChange,
}) => {
  const [uploading, setUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [cropData, setCropData] = useState<CropData>({
    x: 0,
    y: 0,
    width: 300,
    height: 300,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const cropperRef = useRef<HTMLDivElement>(null);

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://guia-atmosfericos.com";

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target?.result) {
        setCurrentImage(e.target.result as string);
        setShowCropper(true);
        // Reset crop to center
        setTimeout(() => {
          if (imageRef.current) {
            const img = imageRef.current;
            const size = Math.min(img.clientWidth, img.clientHeight) * 0.8;
            setCropData({
              x: (img.clientWidth - size) / 2,
              y: (img.clientHeight - size) / 2,
              width: size,
              height: size,
            });
          }
        }, 100);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, action: "drag" | "resize") => {
      e.preventDefault();
      const rect = cropperRef.current?.getBoundingClientRect();
      if (!rect) return;

      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });

      if (action === "drag") {
        setIsDragging(true);
      } else {
        setIsResizing(true);
      }
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging && !isResizing) return;
      if (!imageRef.current) return;

      const imageRect = imageRef.current.getBoundingClientRect();

      const relativeX = e.clientX - imageRect.left;
      const relativeY = e.clientY - imageRect.top;

      if (isDragging) {
        const newX = Math.max(
          0,
          Math.min(relativeX - dragStart.x, imageRect.width - cropData.width)
        );
        const newY = Math.max(
          0,
          Math.min(relativeY - dragStart.y, imageRect.height - cropData.height)
        );

        setCropData((prev) => ({ ...prev, x: newX, y: newY }));
      } else if (isResizing) {
        const newWidth = Math.max(
          50,
          Math.min(relativeX - cropData.x, imageRect.width - cropData.x)
        );
        const newHeight = Math.max(
          50,
          Math.min(relativeY - cropData.y, imageRect.height - cropData.y)
        );

        // Mantener proporción cuadrada
        const size = Math.min(newWidth, newHeight);
        setCropData((prev) => ({ ...prev, width: size, height: size }));
      }
    },
    [isDragging, isResizing, dragStart, cropData]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const cropAndUpload = async () => {
    if (!currentImage || !imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imageRef.current;

    // Calcular la escala entre la imagen mostrada y la real
    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;

    // Configurar canvas con el tamaño del recorte
    canvas.width = cropData.width * scaleX;
    canvas.height = cropData.height * scaleY;

    // Dibujar la parte recortada
    ctx.drawImage(
      img,
      cropData.x * scaleX, // sx
      cropData.y * scaleY, // sy
      cropData.width * scaleX, // sWidth
      cropData.height * scaleY, // sHeight
      0, // dx
      0, // dy
      canvas.width, // dWidth
      canvas.height // dHeight
    );

    // Convertir canvas a blob
    canvas.toBlob(
      async (blob) => {
        if (!blob) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", blob, "cropped-image.jpg");

        try {
          const res = await fetch(`/api/empresa/admin/${empresaId}/upload`, {
            method: "POST",
            body: formData,
          });

          if (!res.ok) throw new Error("Error al subir imagen");

          const data = await res.json();
          const nuevasUrls = (data.urls as string[]).map(
            (url) => `${baseUrl}${url}`
          );

          onChange([...imagenes, ...nuevasUrls]);
          setShowCropper(false);
          setCurrentImage(null);
        } catch (error) {
          console.error("Error al subir imagen:", error);
          alert("Error al subir la imagen. Intentá de nuevo.");
        } finally {
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      },
      "image/jpeg",
      0.9
    );
  };

  const handleEliminar = (url: string) => {
    if (confirm("¿Estás seguro de eliminar esta imagen?")) {
      onChange(imagenes.filter((img) => img !== url));
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      {/* Modal del editor de imagen */}
      {showCropper && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Crop size={20} />
                Recortar Imagen
              </h3>
              <button
                onClick={() => setShowCropper(false)}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Area de recorte */}
              <div className="relative inline-block border border-gray-300 rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imageRef}
                  src={currentImage || ""}
                  alt="Imagen para recortar"
                  className="block max-w-full max-h-96 w-auto h-auto"
                  draggable={false}
                />

                {/* Overlay de recorte */}
                <div
                  ref={cropperRef}
                  className="absolute border-2 border-blue-500 bg-blue-500/20 cursor-move"
                  style={{
                    left: cropData.x,
                    top: cropData.y,
                    width: cropData.width,
                    height: cropData.height,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, "drag")}
                >
                  {/* Handle de redimensión */}
                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleMouseDown(e, "resize");
                    }}
                  />

                  {/* Indicadores de esquinas */}
                  <div className="absolute top-0 left-0 w-2 h-2 bg-blue-500"></div>
                  <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500"></div>
                  <div className="absolute bottom-0 left-0 w-2 h-2 bg-blue-500"></div>
                </div>
              </div>

              {/* Instrucciones */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Instrucciones:</strong> Arrastrá el área azul para
                  posicionar el recorte. Arrastrá la esquina inferior derecha
                  para cambiar el tamaño. La imagen se recortará en formato
                  cuadrado.
                </p>
              </div>

              {/* Botones */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowCropper(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={cropAndUpload}
                  disabled={uploading}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Recortar y subir
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Canvas oculto para el procesamiento */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Grid de imágenes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {/* Imágenes existentes */}
        {imagenes.map((src, index) => (
          <div
            key={src}
            className="group relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50 shadow-sm hover:shadow-md transition-all duration-200"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`Imagen ${index + 1} de la empresa`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
            {/* Overlay con botón eliminar */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <button
                type="button"
                onClick={() => handleEliminar(src)}
                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transform hover:scale-110 transition-all duration-200"
                title="Eliminar imagen"
              >
                <X size={16} />
              </button>
            </div>
            {/* Indicador de imagen principal */}
            {index === 0 && (
              <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                Principal
              </div>
            )}
          </div>
        ))}

        {/* Botón para agregar nueva imagen */}
        <button
          type="button"
          onClick={handleClickUpload}
          disabled={uploading}
          className={`aspect-square rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
            uploading
              ? "border-gray-300 bg-gray-50 cursor-not-allowed"
              : "border-gray-300 hover:border-blue-400 hover:bg-blue-50 bg-gray-50 hover:shadow-md"
          }`}
        >
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <Upload size={18} className="text-gray-500" />
          </div>
          <span className="text-xs text-gray-600 font-medium text-center px-2">
            Agregar imagen
          </span>
        </button>
      </div>

      {/* Input oculto */}
      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        ref={fileInputRef}
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
      />

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <ImageIcon size={12} className="text-white" />
          </div>
          <div className="text-sm text-blue-800 space-y-1">
            <p className="font-medium">Consejos para mejores resultados:</p>
            <ul className="text-blue-700 space-y-1 text-xs">
              <li>
                • La primera imagen será la principal (se mostrará en el
                listado)
              </li>
              <li>• Podés recortar y ajustar cada imagen antes de subirla</li>
              <li>• Formatos soportados: JPG, PNG, WebP</li>
              <li>• Las imágenes se optimizan automáticamente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
