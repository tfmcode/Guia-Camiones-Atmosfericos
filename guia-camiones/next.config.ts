/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "guia-atmosfericos.com",
        pathname: "/uploads/**", // ✅ AMPLIADO: no solo /empresa/ sino todos los uploads
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/uploads/**",
      },
    ],
    // ✅ AGREGADO: Configuraciones de optimización para mejor rendimiento
    formats: ["image/webp", "image/avif"], // Formatos modernos más livianos
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // Tamaños responsivos
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Para íconos y thumbnails
    minimumCacheTTL: 31536000, // Cache de imágenes por 1 año
  },

  // ✅ AGREGADO: Headers para servir archivos estáticos correctamente
  async headers() {
    return [
      {
        // Headers para archivos subidos
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable", // Cache largo para uploads
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*", // CORS para imágenes
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET", // Solo GET para imágenes
          },
        ],
      },
      {
        // Headers para imágenes estáticas del proyecto
        source: "/img/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Headers para otros assets estáticos
        source: "/(favicon.ico|WhatsApp.svg|manifest.json|apple-icon.png)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400", // Cache por 1 día
          },
        ],
      },
    ];
  },

  // ✅ AGREGADO: Optimizaciones de compilación
  experimental: {
    optimizePackageImports: [
      "lucide-react", // Optimizar íconos
      "@heroicons/react", // Optimizar heroicons
    ],
  },

  // ✅ AGREGADO: Configuración para PWA y compresión
  compress: true, // Habilitar compresión gzip

  // ✅ AGREGADO: Configuración de salida para producción
  output: "standalone", // Útil para Docker/contenedores

  // ✅ OPCIONAL: Si querés logging detallado en desarrollo
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === "development",
    },
  },
};

export default nextConfig;
