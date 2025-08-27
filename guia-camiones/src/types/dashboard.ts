// src/types/dashboard.ts
export interface DashboardStats {
  totalEmpresas: number;
  empresasActivas: number;
  empresasDestacadas: number;
  empresasPendientes: number;
  totalUsuarios: number;
  totalAdmins: number;
  totalEmpresaUsers: number;
  totalRegularUsers: number;
  empresasHoy: number;
  empresasSemana: number;
  empresasMes: number;
  topProvincias: Array<{
    provincia: string;
    count: number;
  }>;
  recentActivity: ActivityItem[];
  lastUpdated: string;
}

export interface ActivityItem {
  type: string;
  title: string;
  description: string;
  time: string;
  icon: string;
  color: string;
}

export interface StatCardProps {
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
}
