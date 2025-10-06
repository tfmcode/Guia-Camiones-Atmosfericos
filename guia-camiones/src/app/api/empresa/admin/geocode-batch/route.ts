// src/app/api/empresa/admin/geocode-batch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth";
import pool from "@/lib/db";

const noCacheHeaders = {
  "Cache-Control": "no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

async function geocodeAddress(
  direccion: string,
  localidad?: string,
  provincia?: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const addressParts = [direccion];
    if (localidad) addressParts.push(localidad);
    if (provincia) addressParts.push(provincia);
    addressParts.push("Argentina");
    const fullAddress = addressParts.join(", ");

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ No hay API key de Google Maps configurada");
      return null;
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      fullAddress
    )}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results?.[0]) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
      };
    }

    console.warn(`⚠️ No se pudo geocodificar: ${fullAddress} - ${data.status}`);
    return null;
  } catch (error) {
    console.error("❌ Error en geocodificación:", error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const user = token && verifyJwt(token);

  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  try {
    // Obtener empresas sin coordenadas que tengan dirección
    const { rows: empresasSinCoordenadas } = await pool.query(`
      SELECT id, nombre, direccion, provincia, localidad 
      FROM empresa 
      WHERE (lat IS NULL OR lng IS NULL) 
        AND direccion IS NOT NULL 
        AND direccion != ''
      ORDER BY id
    `);

    console.log(
      `🔄 Geocodificando ${empresasSinCoordenadas.length} empresas...`
    );

    const resultados = {
      total: empresasSinCoordenadas.length,
      exitosas: 0,
      fallidas: 0,
      detalles: [] as Array<{
        id: number;
        nombre: string;
        direccion: string;
        status: "success" | "failed";
        coords?: { lat: number; lng: number };
        error?: string;
      }>,
    };

    // Procesar con delay para evitar rate limits
    for (const empresa of empresasSinCoordenadas) {
      // Delay de 200ms entre requests para respetar límites de Google
      await new Promise((resolve) => setTimeout(resolve, 200));

      const coords = await geocodeAddress(
        empresa.direccion,
        empresa.localidad,
        empresa.provincia
      );

      if (coords) {
        // Actualizar empresa con coordenadas
        await pool.query(
          "UPDATE empresa SET lat = $1, lng = $2 WHERE id = $3",
          [coords.lat, coords.lng, empresa.id]
        );

        resultados.exitosas++;
        resultados.detalles.push({
          id: empresa.id,
          nombre: empresa.nombre,
          direccion: empresa.direccion,
          status: "success",
          coords,
        });

        console.log(`✅ ${empresa.nombre}: ${coords.lat}, ${coords.lng}`);
      } else {
        resultados.fallidas++;
        resultados.detalles.push({
          id: empresa.id,
          nombre: empresa.nombre,
          direccion: empresa.direccion,
          status: "failed",
          error: "No se pudo geocodificar",
        });

        console.log(`❌ ${empresa.nombre}: geocodificación fallida`);
      }
    }

    console.log(
      `✅ Geocodificación completada: ${resultados.exitosas}/${resultados.total} exitosas`
    );

    return NextResponse.json(resultados, { headers: noCacheHeaders });
  } catch (error) {
    console.error("❌ Error en geocodificación batch:", error);
    return NextResponse.json(
      { message: "Error al geocodificar empresas" },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
