// src/app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const user = token && verifyJwt(token);

  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  try {
    // Query para estadísticas de empresas
    const empresaStatsQuery = `
      SELECT 
        COUNT(*) as total_empresas,
        COUNT(*) FILTER (WHERE habilitado = true) as empresas_activas,
        COUNT(*) FILTER (WHERE destacado = true) as empresas_destacadas,
        COUNT(*) FILTER (WHERE habilitado = false) as empresas_pendientes,
        COUNT(*) FILTER (WHERE fecha_creacion >= CURRENT_DATE) as empresas_hoy,
        COUNT(*) FILTER (WHERE fecha_creacion >= CURRENT_DATE - INTERVAL '7 days') as empresas_semana,
        COUNT(*) FILTER (WHERE fecha_creacion >= CURRENT_DATE - INTERVAL '30 days') as empresas_mes
      FROM empresa;
    `;

    // Query para estadísticas de usuarios
    const usuarioStatsQuery = `
      SELECT 
        COUNT(*) as total_usuarios,
        COUNT(*) FILTER (WHERE rol = 'ADMIN') as total_admins,
        COUNT(*) FILTER (WHERE rol = 'EMPRESA') as total_empresa_users
      FROM usuario;
    `;

    // Query para top provincias
    const provinciasQuery = `
      SELECT 
        provincia,
        COUNT(*) as count
      FROM empresa 
      WHERE provincia IS NOT NULL AND habilitado = true
      GROUP BY provincia
      ORDER BY count DESC
      LIMIT 5;
    `;

    // Ejecutar todas las queries
    const [empresaStats, usuarioStats, topProvincias] = await Promise.all([
      pool.query(empresaStatsQuery),
      pool.query(usuarioStatsQuery),
      pool.query(provinciasQuery),
    ]);

    const stats = {
      // Estadísticas de empresas
      totalEmpresas: parseInt(empresaStats.rows[0].total_empresas),
      empresasActivas: parseInt(empresaStats.rows[0].empresas_activas),
      empresasDestacadas: parseInt(empresaStats.rows[0].empresas_destacadas),
      empresasPendientes: parseInt(empresaStats.rows[0].empresas_pendientes),
      empresasHoy: parseInt(empresaStats.rows[0].empresas_hoy),
      empresasSemana: parseInt(empresaStats.rows[0].empresas_semana),
      empresasMes: parseInt(empresaStats.rows[0].empresas_mes),

      // Estadísticas de usuarios
      totalUsuarios: parseInt(usuarioStats.rows[0].total_usuarios),
      totalAdmins: parseInt(usuarioStats.rows[0].total_admins),
      totalEmpresaUsers: parseInt(usuarioStats.rows[0].total_empresa_users),

      // Top provincias
      topProvincias: topProvincias.rows,
    };

    // Obtener actividad reciente (últimas 10 acciones)
    const activityQuery = `
      WITH empresa_activity AS (
        SELECT 
          'empresa_registrada' as type,
          'Nueva empresa registrada' as title,
          nombre || ' se registró' as description,
          CASE 
            WHEN fecha_creacion >= NOW() - INTERVAL '1 hour' THEN 'Hace ' || EXTRACT(MINUTE FROM NOW() - fecha_creacion)::int || ' min'
            WHEN fecha_creacion >= NOW() - INTERVAL '1 day' THEN 'Hace ' || EXTRACT(HOUR FROM NOW() - fecha_creacion)::int || ' h'
            WHEN fecha_creacion >= NOW() - INTERVAL '7 days' THEN 'Hace ' || EXTRACT(DAY FROM NOW() - fecha_creacion)::int || ' días'
            ELSE TO_CHAR(fecha_creacion, 'DD/MM/YYYY')
          END as time,
          'Building2' as icon,
          'blue' as color,
          fecha_creacion as timestamp
        FROM empresa 
        WHERE fecha_creacion >= NOW() - INTERVAL '30 days'
      ),
      usuario_activity AS (
        SELECT 
          'usuario_creado' as type,
          'Usuario creado' as title,
          'Se creó cuenta para ' || email as description,
          CASE 
            WHEN creado_en >= NOW() - INTERVAL '1 hour' THEN 'Hace ' || EXTRACT(MINUTE FROM NOW() - creado_en)::int || ' min'
            WHEN creado_en >= NOW() - INTERVAL '1 day' THEN 'Hace ' || EXTRACT(HOUR FROM NOW() - creado_en)::int || ' h'
            WHEN creado_en >= NOW() - INTERVAL '7 days' THEN 'Hace ' || EXTRACT(DAY FROM NOW() - creado_en)::int || ' días'
            ELSE TO_CHAR(creado_en, 'DD/MM/YYYY')
          END as time,
          'Users' as icon,
          'green' as color,
          creado_en as timestamp
        FROM usuario 
        WHERE creado_en >= NOW() - INTERVAL '30 days'
      )
      SELECT type, title, description, time, icon, color
      FROM (
        SELECT * FROM empresa_activity
        UNION ALL
        SELECT * FROM usuario_activity
      ) combined_activity
      ORDER BY timestamp DESC
      LIMIT 10;
    `;

    const { rows: activityRows } = await pool.query(activityQuery);

    const response = {
      ...stats,
      recentActivity: activityRows,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Error al obtener estadísticas:", error);
    return NextResponse.json(
      { message: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
