"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import FormField from "@/components/ui/FormField";
import type { Usuario, UsuarioInput } from "@/types/usuario";
import axios from "axios";
import { Users, Plus, AlertCircle } from "lucide-react";

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

      // Manejo correcto del error de Axios
      let errorMessage =
        "Error al guardar usuario. Verifica que el email no esté ya registrado.";

      // Verificación de tipo más robusta para errores de Axios
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

  const renderRol = (usuario: UsuarioWithIndex) => {
    const colores = {
      ADMIN: "bg-red-100 text-red-800",
      EMPRESA: "bg-blue-100 text-blue-800",
      USUARIO: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colores[usuario.rol]
        }`}
      >
        {usuario.rol}
      </span>
    );
  };

  // Convertir usuarios para compatibilidad con DataTable
  const usuariosConIndex: UsuarioWithIndex[] = usuarios.map((usuario) => ({
    ...usuario,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gestión de Usuarios
            </h1>
            <p className="text-gray-600">
              Administra las cuentas de usuario del sistema
            </p>
          </div>
        </div>

        <button
          onClick={abrirNuevo}
          disabled={loading || tableLoading}
          className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors ${
            loading || tableLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <Plus size={18} />
          Nuevo Usuario
        </button>
      </div>

      {/* Mensajes globales */}
      {error && !modalAbierto && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={() => setError("")}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Tabla de usuarios */}
      <DataTable<UsuarioWithIndex>
        data={usuariosConIndex}
        loading={tableLoading}
        searchKeys={["nombre", "email"]}
        columns={[
          {
            key: "nombre",
            label: "Nombre",
            sortable: true,
            width: "w-1/4",
          },
          {
            key: "email",
            label: "Email",
            sortable: true,
            width: "w-1/3",
          },
          {
            key: "rol",
            label: "Rol",
            sortable: true,
            render: renderRol,
            width: "w-1/6",
          },
          {
            key: "creado_en",
            label: "Fecha de Registro",
            sortable: true,
            render: (usuario: UsuarioWithIndex) =>
              formatearFecha(usuario.creado_en),
            width: "w-1/4",
          },
        ]}
        onEdit={abrirEditar}
        onDelete={eliminar}
        pageSize={15}
      />

      {/* Modal */}
      <Modal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={modoEdicion ? "Editar Usuario" : "Nuevo Usuario"}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            guardar();
          }}
          className="space-y-6"
        >
          {/* Mensajes del modal */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">✓</span>
              </div>
              <p className="text-green-700 text-sm font-medium">{success}</p>
            </div>
          )}

          {/* Campos del formulario */}
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

          <FormField
            label={modoEdicion ? "Nueva Contraseña (opcional)" : "Contraseña"}
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
                : undefined
            }
          />

          <FormField
            label="Rol"
            name="rol"
            value={form.rol}
            onChange={handleChange}
            type="select"
            options={rolOptions}
            required
            disabled={loading}
            helperText="Determina los permisos del usuario en el sistema"
          />

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setModalAbierto(false)}
              disabled={loading}
              className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Guardando..."
                : modoEdicion
                ? "Actualizar"
                : "Crear Usuario"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
