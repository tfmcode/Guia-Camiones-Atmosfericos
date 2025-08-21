"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Building2,
  Shield,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Plus,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalEmpresas: number;
  empresasActivas: number;
  totalUsuarios: number;
  empresasDestacadas: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmpresas: 0,
    empresasActivas: 0,
    totalUsuarios: 0,
    empresasDestacadas: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Simular carga de estadísticas - aquí irían las llamadas reales a la API
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Datos simulados - reemplazar con API calls reales
        setStats({
          totalEmpresas: 48,
          empresasActivas: 42,
          totalUsuarios: 56,
          empresasDestacadas: 8,
        });
      } catch (error) {
        console.error("Error al cargar estadísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    href,
    subtitle,
  }: {
    title: string;
    value: number;
    icon: React.ElementType;
    color: string;
    href: string;
    subtitle?: string;
  }) => (
    <Link href={href} className="group">
      <div
        className={`bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 group-hover:border-${color}-200 group-hover:shadow-${color}-100/50`}
      >
        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-12 h-12 bg-${color}-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
          >
            <Icon size={24} className="text-white" />
          </div>
          <ArrowRight
            size={20}
            className={`text-gray-400 group-hover:text-${color}-500 transition-colors`}
          />
        </div>

        <div className="space-y-1">
          <p className="text-2xl font-bold text-gray-900">
            {loading ? (
              <div className="w-12 h-8 bg-gray-200 rounded animate-pulse" />
            ) : (
              value.toLocaleString()
            )}
          </p>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </Link>
  );

  const quickActions = [
    {
      title: "Nueva Empresa",
      description: "Registrar una empresa manualmente",
      icon: Building2,
      href: "/panel/admin/empresas",
      color: "blue",
    },
    {
      title: "Nuevo Usuario",
      description: "Crear cuenta de usuario o admin",
      icon: Users,
      href: "/panel/admin/usuarios",
      color: "green",
    },
    {
      title: "Ver Sitio",
      description: "Revisar el sitio público",
      icon: Shield,
      href: "/",
      color: "purple",
      external: true,
    },
  ];

  const recentActivity = [
    {
      type: "empresa_registrada",
      title: "Nueva empresa registrada",
      description: "Servicios Ambientales SRL se registró",
      time: "Hace 2 horas",
      icon: Building2,
      color: "blue",
    },
    {
      type: "usuario_creado",
      title: "Usuario creado",
      description: "Se creó cuenta para juan@empresa.com",
      time: "Hace 5 horas",
      icon: Users,
      color: "green",
    },
    {
      type: "empresa_activada",
      title: "Empresa activada",
      description: "EcoLimpio fue habilitada en la guía",
      time: "Ayer",
      icon: CheckCircle,
      color: "emerald",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
              <Shield size={24} className="text-white" />
            </div>
            Panel de Administración
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona usuarios, empresas y configuraciones del sistema desde
            aquí.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock size={16} />
          <span>Última actualización: hace {loading ? "..." : "5 min"}</span>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Empresas"
          value={stats.totalEmpresas}
          icon={Building2}
          color="blue"
          href="/panel/admin/empresas"
          subtitle="Empresas registradas"
        />
        <StatCard
          title="Empresas Activas"
          value={stats.empresasActivas}
          icon={CheckCircle}
          color="green"
          href="/panel/admin/empresas"
          subtitle="Visibles en la guía"
        />
        <StatCard
          title="Total Usuarios"
          value={stats.totalUsuarios}
          icon={Users}
          color="purple"
          href="/panel/admin/usuarios"
          subtitle="Cuentas creadas"
        />
        <StatCard
          title="Destacadas"
          value={stats.empresasDestacadas}
          icon={TrendingUp}
          color="amber"
          href="/panel/admin/empresas"
          subtitle="Empresas destacadas"
        />
      </div>

      {/* Grid de contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Acciones rápidas */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus size={20} className="text-blue-500" />
              Acciones Rápidas
            </h2>

            <div className="space-y-3">
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  target={action.external ? "_blank" : undefined}
                  className={`group flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-${action.color}-200 hover:bg-${action.color}-50 transition-all duration-200`}
                >
                  <div
                    className={`w-8 h-8 bg-${action.color}-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <action.icon size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">
                      {action.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight
                    size={16}
                    className={`text-gray-400 group-hover:text-${action.color}-500 transition-colors`}
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock size={20} className="text-gray-500" />
              Actividad Reciente
            </h2>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`w-8 h-8 bg-${activity.color}-500 rounded-lg flex items-center justify-center`}
                    >
                      <activity.icon size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t border-gray-200">
                  <Link
                    href="/panel/admin/actividad"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    Ver toda la actividad
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alertas o notificaciones */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertCircle size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 mb-1">
              Estado del Sistema
            </h3>
            <p className="text-amber-800 text-sm leading-relaxed">
              Todo funcionando correctamente. {stats.empresasActivas} empresas
              activas de {stats.totalEmpresas} registradas. Hay{" "}
              {stats.totalEmpresas - stats.empresasActivas} empresas pendientes
              de revisión.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
