"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { esCaba, getBarriosFormateados } from "@/constants/barrios";

export default function RegistroEmpresa() {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    provincia: "",
    localidad: "",
    password: "",
  });
  const [provincias, setProvincias] = useState<
    { id: string; nombre: string }[]
  >([]);
  const [localidades, setLocalidades] = useState<
    { id: string; nombre: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("https://apis.datos.gob.ar/georef/api/provincias?campos=id,nombre")
      .then((res) => res.json())
      .then((data) => setProvincias(data.provincias));
  }, []);

  useEffect(() => {
    const cargarLocalidades = async () => {
      if (!form.provincia) {
        setLocalidades([]);
        return;
      }

      try {
        // ✅ Detectar si es CABA
        if (esCaba(form.provincia)) {
          console.log("🏙️ Cargando barrios de CABA...");
          const barrios = getBarriosFormateados();
          setLocalidades(barrios);
          console.log(`✅ ${barrios.length} barrios de CABA cargados`);
          return;
        }

        // ✅ Para el resto de provincias usar la API normal
        console.log(`🌎 Cargando municipios de ${form.provincia}...`);

        const response = await fetch(
          `https://apis.datos.gob.ar/georef/api/municipios?provincia=${encodeURIComponent(
            form.provincia
          )}&campos=id,nombre&max=1000`
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const municipios = data.municipios || [];

        setLocalidades(municipios);
        console.log(
          `✅ ${municipios.length} municipios cargados para ${form.provincia}`
        );
      } catch (error) {
        console.error("❌ Error cargando localidades:", error);
        setLocalidades([]);

        // Fallback para CABA
        if (esCaba(form.provincia)) {
          console.log("🔄 Usando fallback para barrios de CABA...");
          setLocalidades(getBarriosFormateados());
        }
      }
    };

    cargarLocalidades();
  }, [form.provincia]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = { ...form };

    try {
      await axios.post("/api/registro", payload);
      alert("Empresa registrada exitosamente");
      setForm({
        nombre: "",
        email: "",
        telefono: "",
        provincia: "",
        localidad: "",
        password: "",
      });
      router.push("/login");
    } catch (error) {
      console.error("Error al registrar la empresa:", error);

      if (typeof error === "object" && error !== null && "response" in error) {
        const mensaje = (
          error as { response?: { data?: { mensaje?: string } } }
        ).response?.data?.mensaje;
        setError(mensaje || "Error inesperado. Intentá de nuevo.");
      } else {
        setError("Error inesperado. Intentá de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold mb-8 text-center text-[#1c2e39]">
        Registrá tu Empresa
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-8 rounded-xl shadow-md border border-[#1c2e39]/10"
      >
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded text-sm text-center">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold mb-1 text-[#1c2e39]">
            Nombre de la empresa
          </label>
          <input
            type="text"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 text-[#1c2e39]">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 text-[#1c2e39]">
            Teléfono
          </label>
          <input
            type="text"
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-[#1c2e39]">
              Provincia
            </label>
            <select
              name="provincia"
              value={form.provincia}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="">Seleccioná una provincia</option>
              {provincias.map((prov) => (
                <option key={prov.id} value={prov.nombre}>
                  {prov.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-[#1c2e39]">
              {esCaba(form.provincia || "") ? "Barrio" : "Localidad"}
            </label>
            <select
              name="localidad"
              value={form.localidad}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="">
                {esCaba(form.provincia || "")
                  ? "Seleccioná un barrio"
                  : "Seleccioná una localidad"}
              </option>
              {localidades.map((loc) => (
                <option key={loc.id} value={loc.nombre}>
                  {loc.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 text-[#1c2e39]">
            Contraseña
          </label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            autoComplete="new-password"
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full font-semibold py-3 px-6 rounded-lg shadow transition duration-300 ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#1c2e39] text-white hover:scale-105 hover:shadow-lg"
          }`}
        >
          {loading ? "Registrando..." : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
}
