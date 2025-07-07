"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import type { Usuario, UsuarioInput } from "@/types/usuario";
import axios from "axios";

export default function UsuariosAdminPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState<UsuarioInput>({
    nombre: "",
    email: "",
    password: "",
    rol: "ADMIN",
  });
  const [modoEdicion, setModoEdicion] = useState(false);
  const [usuarioIdEditar, setUsuarioIdEditar] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const res = await fetch("/api/usuarios");
      const data = await res.json();
      setUsuarios(data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      alert("Error al cargar usuarios.");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const abrirNuevo = () => {
    setForm({ nombre: "", email: "", password: "", rol: "ADMIN" });
    setUsuarioIdEditar(null);
    setModoEdicion(false);
    setError("");
    setModalAbierto(true);
  };

  const abrirEditar = (usuario: Usuario) => {
    setForm({
      nombre: usuario.nombre,
      email: usuario.email,
      password: "",
      rol: usuario.rol,
    });
    setUsuarioIdEditar(usuario.id);
    setModoEdicion(true);
    setError("");
    setModalAbierto(true);
  };

  const guardar = async () => {
    // Validación mínima antes de enviar
    if (!form.nombre.trim() || !form.email.trim()) {
      setError("Nombre y Email son obligatorios.");
      return;
    }
    if (!modoEdicion && form.password.length < 4) {
      setError("La contraseña debe tener al menos 4 caracteres.");
      return;
    }

    setLoading(true);
    try {
      if (modoEdicion && usuarioIdEditar !== null) {
        await axios.put(`/api/usuarios/${usuarioIdEditar}`, form);
      } else {
        await axios.post("/api/usuarios", form);
      }
      setModalAbierto(false);
      fetchUsuarios();
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      alert("Error al guardar usuario.");
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async (usuario: Usuario) => {
    if (!confirm(`¿Eliminar a ${usuario.nombre}?`)) return;
    setLoading(true);
    try {
      await axios.delete(`/api/usuarios/${usuario.id}`);
      fetchUsuarios();
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      alert("Error al eliminar usuario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <button
          onClick={abrirNuevo}
          className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={loading}
        >
          Nuevo Usuario
        </button>
      </div>

      <DataTable
        data={usuarios}
        columns={[
          { key: "nombre", label: "Nombre" },
          { key: "email", label: "Email" },
          { key: "rol", label: "Rol" },
        ]}
        onEdit={abrirEditar}
        onDelete={eliminar}
      />

      <Modal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={modoEdicion ? "Editar Usuario" : "Nuevo Usuario"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            guardar();
          }}
          className="space-y-4"
        >
          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded text-sm text-center">
              {error}
            </div>
          )}

          <FormField
            label="Nombre"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
          />
          <FormField
            label="Email"
            name="email"
            value={form.email}
            onChange={handleChange}
            type="email"
          />
          <FormField
            label="Contraseña"
            name="password"
            value={form.password}
            onChange={handleChange}
            type="password"
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Rol
            </label>
            <select
              name="rol"
              value={form.rol}
              onChange={(e) =>
                setForm({ ...form, rol: e.target.value as UsuarioInput["rol"] })
              }
              className="block w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="EMPRESA">EMPRESA</option>
              <option value="USUARIO">USUARIO</option>
            </select>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
