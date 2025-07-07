"use client";

import { X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white w-full max-w-md sm:max-w-lg rounded-2xl shadow-xl p-6 md:p-8 space-y-6 mx-4 animate-fade-in max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-rounded">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-700 transition p-1.5 rounded-full focus:outline-none"
          aria-label="Cerrar modal"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-zinc-800 border-b pb-3">
          {title}
        </h2>
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}
