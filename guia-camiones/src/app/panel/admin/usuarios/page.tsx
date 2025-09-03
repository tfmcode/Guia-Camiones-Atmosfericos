"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import type { Usuario, UsuarioInput } from "@/types/usuario";
import axios from "axios";
import { Users, Plus, AlertCircle, Mail, Calendar, User } from "lucide-react";

// Extender Usuario para que sea compatible con DataTable
type UsuarioWithIndex = Usuario & Record<string, unknown>;

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
  const [tableLoading, setTableLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setTableLoading(true);
    try {
      const res = await fetch("/api/usuarios");
      const data = await res.json();
      setUsuarios(data);
    } catch (err: unknown) {
      console.error("Error al cargar usuarios:", err);
      setError("Error al cargar usuarios.");
    } finally {
      setTableLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Limpiar errores al editar
    if (error) setError("");
  };

  const abrirNuevo = () => {
    setForm({ nombre: "", email: "", password: "", rol: "ADMIN" });
    setUsuarioIdEditar(null);
    setModoEdicion(false);
    setError("");
    setSuccess("");
    setModalAbierto(true);
  };

  const abrirEditar = (usuario: UsuarioWithIndex) => {
    setForm({
      nombre: usuario.nombre,
      email: usuario.email,
      password: "",
      rol: usuario.rol,
    });
    setUsuarioIdEditar(usuario.id);
    setModoEdicion(true);
    setError("");
    setSuccess("");
    setModalAbierto(true);
  };

  const validateForm = () => {
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return false;
    }
    if (!form.email.trim()) {
      setError("El email es obligatorio.");
      return false;
    }
    if (!form.email.includes("@")) {
      setError("El email debe tener un formato válido.");
      return false;
    }
    if (!modoEdicion && form.password.length < 4) {
      setError("La contraseña debe tener al menos 4 caracteres.");
      return false;
    }
    if (modoEdicion && form.password && form.password.length < 4) {
      setError("Si cambias la contraseña, debe tener al menos 4 caracteres.");
      return false;
    }
    return true;
  };

  const guardar = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      if (modoEdicion && usuarioIdEditar !== null) {
        await axios.put(`/api/usuarios/${usuarioIdEditar}`, form);
        setSuccess("Usuario actualizado correctamente");
      } else {
        await axios.post("/api/usuarios", form);
        setSuccess("Usuario creado correctamente");
      }

      setTimeout(() => {
        setModalAbierto(false);
        setSuccess("");
        fetchUsuarios();
      }, 1500);
    } catch (err: unknown) {
      console.error("Error al guardar usuario:", err);

      let errorMessage =
        "Error al guardar usuario. Verifica que el email no esté ya registrado.";

      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data &&
        typeof err.response.data.message === "string"
      ) {
        errorMessage = err.response.data.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async (usuario: UsuarioWithIndex) => {
    if (
      !confirm(
        `¿Eliminar al usuario "${usuario.nombre}"?\n\nEsta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    setTableLoading(true);
    try {
      await axios.delete(`/api/usuarios/${usuario.id}`);
      await fetchUsuarios();
    } catch (err: unknown) {
      console.error("Error al eliminar usuario:", err);
      setError("Error al eliminar usuario.");
    }
  };

  const rolOptions = [
    { value: "ADMIN", label: "Administrador" },
    { value: "EMPRESA", label: "Empresa" },
    { value: "USUARIO", label: "Usuario" },
  ];

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ✅ MEJORADO: Render de rol con mejor diseño
  const renderRol = (usuario: UsuarioWithIndex) => {
    const colores = {
      ADMIN: "bg-red-100 text-red-800 border-red-200",
      EMPRESA: "bg-blue-100 text-blue-800 border-blue-200",
      USUARIO: "bg-gray-100 text-gray-800 border-gray-200",
    };

    return (
      <span
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
          colores[usuario.rol]
        }`}
      >
        {usuario.rol}
      </span>
    );
  };

  // ✅ NUEVO: Render de nombre con email
  const renderNombreConEmail = (usuario: UsuarioWithIndex) => (
    <div className="space-y-1">
      <div className="font-semibold text-gray-900 text-sm flex items-center gap-2">
        <User size={14} className="text-gray-500" />
        <span className="truncate max-w-[180px]">{usuario.nombre}</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <Mail size={12} />
        <span className="truncate max-w-[180px]">{usuario.email}</span>
      </div>
    </div>
  );

  // ✅ NUEVO: Render de fecha mejorado
  const renderFechaCreacion = (usuario: UsuarioWithIndex) => (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Calendar size={14} className="text-gray-400" />
      <span>{formatearFecha(usuario.creado_en)}</span>
    </div>
  );

  // Convertir usuarios para compatibilidad con DataTable
  const usuariosConIndex: UsuarioWithIndex[] = usuarios.map((usuario) => ({
    ...usuario,
  }));

  return (
    <div className="space-y-6">
      {/* ✅ MEJORADO: Header más profesional */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Users size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestión de Usuarios
              </h1>
              <p className="text-gray-600 mt-1">
                Administra las cuentas de usuario del sistema
              </p>
            </div>
          </div>

          <button
            onClick={abrirNuevo}
            disabled={loading || tableLoading}
            className={`flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 ${
              loading || tableLoading
                ? "opacity-50 cursor-not-allowed transform-none"
                : "hover:bg-blue-700 hover:scale-105"
            }`}
          >
            <Plus size={20} />
            Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Mensajes globales */}
      {error && !modalAbierto && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle size={16} className="text-white" />
          </div>
          <p className="text-red-700 text-sm font-medium flex-1">{error}</p>
          <button
            onClick={() => setError("")}
            className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg p-1 transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* ✅ NUEVO: DataTable con columnas optimizadas */}
      <DataTable<UsuarioWithIndex>
        data={usuariosConIndex}
        loading={tableLoading}
        searchKeys={["nombre", "email"]}
        columns={[
          {
            key: "nombre",
            label: "Usuario",
            sortable: true,
            render: renderNombreConEmail,
            width: "min-w-[220px]",
            sticky: true, // ✅ Columna fija para mejor navegación
          },
          {
            key: "rol",
            label: "Rol y Permisos",
            sortable: true,
            render: renderRol,
            width: "min-w-[140px]",
          },
          {
            key: "creado_en",
            label: "Fecha de Registro",
            sortable: true,
            render: renderFechaCreacion,
            width: "min-w-[160px]",
          },
        ]}
        onEdit={abrirEditar}
        onDelete={eliminar}
        pageSize={15}
      />

      {/* ✅ MEJORADO: Modal más espacioso */}
      <Modal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={modoEdicion ? "Editar Usuario" : "Nuevo Usuario"}
        size="lg"
      >
        <div className="max-h-[80vh] overflow-y-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              guardar();
            }}
            className="space-y-6 p-2"
          >
            {/* Mensajes del modal */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={14} className="text-white" />
                </div>
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <p className="text-green-700 text-sm font-medium">{success}</p>
              </div>
            )}

            {/* ✅ MEJORADO: Campos organizados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Nombre completo"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ej: Juan Pérez"
                required
                disabled={loading}
              />

              <FormField
                label="Email"
                name="email"
                value={form.email}
                onChange={handleChange}
                type="email"
                placeholder="usuario@example.com"
                required
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label={
                  modoEdicion ? "Nueva Contraseña (opcional)" : "Contraseña"
                }
                name="password"
                value={form.password}
                onChange={handleChange}
                type="password"
                placeholder={
                  modoEdicion
                    ? "Dejar vacío para mantener actual"
                    : "Mínimo 4 caracteres"
                }
                required={!modoEdicion}
                disabled={loading}
                helperText={
                  modoEdicion
                    ? "Solo completar si quieres cambiar la contraseña"
                    : "La contraseña debe tener al menos 4 caracteres"
                }
              />

              <FormField
                label="Rol del usuario"
                name="rol"
                value={form.rol}
                onChange={handleChange}
                type="select"
                options={rolOptions}
                required
                disabled={loading}
                helperText="Determina los permisos del usuario en el sistema"
              />
            </div>

            {/* ✅ NUEVO: Información sobre roles */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">
                Información sobre roles
              </h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center gap-2">
                  <span>
                    <strong>ADMIN:</strong> Acceso completo al sistema
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>
                    <strong>EMPRESA:</strong> Puede gestionar su perfil de
                    empresa
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>
                    <strong>USUARIO:</strong> Acceso básico (reservado para
                    futuro)
                  </span>
                </div>
              </div>
            </div>

            {/* ✅ MEJORADO: Botones más profesionales */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                disabled={loading}
                className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 ${
                  loading
                    ? "opacity-50 cursor-not-allowed transform-none"
                    : "hover:bg-blue-700 hover:scale-105"
                }`}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Guardando...
                  </div>
                ) : modoEdicion ? (
                  "Actualizar Usuario"
                ) : (
                  "Crear Usuario"
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
