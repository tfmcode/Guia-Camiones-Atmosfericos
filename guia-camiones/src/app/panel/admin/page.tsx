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
  RefreshCw,
  TrendingDown,
  MapPin,
  UserCheck,
} from "lucide-react";
import Link from "next/link";

// Tipos
interface DashboardStats {
  totalEmpresas: number;
  empresasActivas: number;
  empresasDestacadas: number;
  empresasPendientes: number;
  totalUsuarios: number;
  totalAdmins: number;
  totalEmpresaUsers: number;
  empresasSemana: number;
  empresasHoy: number;
  empresasMes?: number;
  topProvincias: Array<{
    provincia: string;
    count: number;
  }>;
  recentActivity: ActivityItem[];
  lastUpdated: string;
}

interface ActivityItem {
  type: string;
  title: string;
  description: string;
  time: string;
  icon: string;
  color: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false); // ✅ Para evitar hidratación

  // ✅ Evitar problemas de hidratación
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchStats = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);

    try {
      const res = await fetch("/api/admin/stats", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Error al cargar estadísticas");
      }

      const data = await res.json();
      setStats(data);
      setError(null);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
      setError("Error al cargar las estadísticas del dashboard");
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Auto-refresh cada 5 minutos
    const interval = setInterval(() => {
      fetchStats();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchStats(true);
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    href,
    subtitle,
    trend,
  }: {
    title: string;
    value: number;
    icon: React.ElementType;
    color: string;
    href: string;
    subtitle?: string;
    trend?: {
      value: number;
      isPositive: boolean;
      period: string;
    };
  }) => (
    <Link href={href} className="group">
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 group-hover:border-blue-200 group-hover:shadow-blue-100/50">
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

        <div className="space-y-2">
          <div className="flex items-end gap-2">
            {/* ✅ FIX: Usar div en lugar de p para evitar nesting inválido */}
            <div className="text-2xl font-bold text-gray-900">
              {!mounted || loading ? (
                <div className="w-12 h-8 bg-gray-200 rounded animate-pulse" />
              ) : (
                value.toLocaleString()
              )}
            </div>
            {trend && mounted && !loading && (
              <div
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                  trend.isPositive
                    ? "text-green-600 bg-green-100"
                    : "text-red-600 bg-red-100"
                }`}
              >
                {trend.isPositive ? (
                  <TrendingUp size={12} />
                ) : (
                  <TrendingDown size={12} />
                )}
                {trend.value}% {trend.period}
              </div>
            )}
          </div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </Link>
  );

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, React.ElementType> = {
      Building2: Building2,
      Users: Users,
      CheckCircle: CheckCircle,
      UserCheck: UserCheck,
    };
    return icons[iconName] || Building2;
  };

  // ✅ No renderizar hasta que esté mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            Cargando panel de administrador...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error al cargar el dashboard
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchStats()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw size={16} />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

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

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock size={16} />
            <span>
              Última actualización:{" "}
              {loading || !stats?.lastUpdated
                ? "..."
                : new Date(stats.lastUpdated).toLocaleTimeString("es-AR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
            </span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Empresas"
          value={stats?.totalEmpresas || 0}
          icon={Building2}
          color="blue"
          href="/panel/admin/empresas"
          subtitle="Empresas registradas"
          trend={
            stats?.empresasSemana
              ? {
                  value: stats.empresasSemana,
                  isPositive: true,
                  period: "esta semana",
                }
              : undefined
          }
        />
        <StatCard
          title="Empresas Activas"
          value={stats?.empresasActivas || 0}
          icon={CheckCircle}
          color="green"
          href="/panel/admin/empresas"
          subtitle="Visibles en la guía"
        />
        <StatCard
          title="Total Usuarios"
          value={stats?.totalUsuarios || 0}
          icon={Users}
          color="purple"
          href="/panel/admin/usuarios"
          subtitle="Cuentas creadas"
        />
        <StatCard
          title="Destacadas"
          value={stats?.empresasDestacadas || 0}
          icon={TrendingUp}
          color="amber"
          href="/panel/admin/empresas"
          subtitle="Empresas destacadas"
        />
      </div>

      {/* Grid de contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Acciones rápidas */}
        <div className="lg:col-span-1 space-y-6">
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
                  className="group flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-all duration-200"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
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
                    className="text-gray-400 group-hover:text-blue-500 transition-colors"
                  />
                </Link>
              ))}
            </div>
          </div>

          {/* Top Provincias */}
          {stats?.topProvincias && stats.topProvincias.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-green-500" />
                Provincias con más empresas
              </h2>
              <div className="space-y-3">
                {stats.topProvincias.slice(0, 5).map((provincia, index) => (
                  <div
                    key={provincia.provincia}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-green-700">
                          {index + 1}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {provincia.provincia}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 font-medium">
                      {provincia.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {stats.recentActivity.map((activity, index) => {
                  const IconComponent = getIconComponent(activity.icon);
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className={`w-8 h-8 bg-${activity.color}-500 rounded-lg flex items-center justify-center`}
                      >
                        <IconComponent size={16} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">
                  No hay actividad reciente
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estadísticas adicionales */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Usuarios por Tipo
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Administradores</span>
                <span className="font-semibold text-red-600">
                  {stats.totalAdmins}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Empresas</span>
                <span className="font-semibold text-blue-600">
                  {stats.totalEmpresaUsers}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Crecimiento
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Hoy</span>
                <span className="font-semibold text-green-600">
                  +{stats.empresasHoy}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Esta semana</span>
                <span className="font-semibold text-blue-600">
                  +{stats.empresasSemana}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Este mes</span>
                <span className="font-semibold text-purple-600">
                  +{stats.empresasMes || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pendientes</span>
                <span className="font-semibold text-amber-600">
                  {stats.empresasPendientes}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Tasa de aprobación
                </span>
                <span className="font-semibold text-green-600">
                  {stats.totalEmpresas > 0
                    ? Math.round(
                        (stats.empresasActivas / stats.totalEmpresas) * 100
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

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
            {loading ? (
              <div className="space-y-2">
                <div className="h-4 bg-amber-200 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-amber-200 rounded animate-pulse w-1/2" />
              </div>
            ) : stats ? (
              <p className="text-amber-800 text-sm leading-relaxed">
                Todo funcionando correctamente. {stats.empresasActivas} empresas
                activas de {stats.totalEmpresas} registradas.
                {stats.empresasPendientes > 0 && (
                  <>
                    {" "}
                    Hay {stats.empresasPendientes} empresa
                    {stats.empresasPendientes !== 1 ? "s" : ""} pendiente
                    {stats.empresasPendientes !== 1 ? "s" : ""} de revisión.
                  </>
                )}
                {stats.empresasHoy > 0 && (
                  <>
                    {" "}
                    Se registraron {stats.empresasHoy} empresa
                    {stats.empresasHoy !== 1 ? "s" : ""} hoy.
                  </>
                )}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
