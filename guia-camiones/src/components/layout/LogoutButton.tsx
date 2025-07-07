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
      className="text-sm bg-white text-[#172a56] px-3 py-1 rounded border border-[#172a56] hover:bg-[#172a56] hover:text-white transition"
    >
      Cerrar sesión
    </button>
  );
}
