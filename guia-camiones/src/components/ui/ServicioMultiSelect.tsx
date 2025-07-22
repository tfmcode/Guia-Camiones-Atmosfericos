import { useEffect, useState } from "react";
import axios from "axios";
import Select, { MultiValue } from "react-select";

interface Servicio {
  id: number;
  nombre: string;
}

interface ServicioOption {
  value: number;
  label: string;
}

interface Props {
  serviciosSeleccionados: number[];
  onChange: (ids: number[]) => void;
}

export default function ServicioMultiSelect({
  serviciosSeleccionados,
  onChange,
}: Props) {
  const [servicios, setServicios] = useState<Servicio[]>([]);

  useEffect(() => {
    const fetchServicios = async () => {
      try {
        const res = await axios.get<Servicio[]>("/api/servicios");
        setServicios(res.data);
      } catch (error) {
        console.error("Error al cargar servicios:", error);
      }
    };

    fetchServicios();
  }, []);

  const options: ServicioOption[] = servicios.map((s) => ({
    value: s.id,
    label: s.nombre,
  }));

  const selectedOptions = options.filter((opt) =>
    serviciosSeleccionados.includes(opt.value)
  );

  const handleChange = (selected: MultiValue<ServicioOption>) => {
    onChange(selected.map((s) => s.value));
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        Servicios
      </label>
      <Select
        isMulti
        options={options}
        value={selectedOptions}
        onChange={handleChange}
        placeholder="Seleccioná uno o más servicios"
        className="text-sm"
        classNamePrefix="react-select"
      />
    </div>
  );
}
