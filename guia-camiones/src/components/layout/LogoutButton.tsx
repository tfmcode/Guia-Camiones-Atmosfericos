"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <button
      onClick={logout}
      className="text-sm bg-white text-red-600 px-3 py-1 rounded border border-red-600 hover:bg-red-600 hover:text-white transition"
    >
      Cerrar sesión
    </button>
  );
}
