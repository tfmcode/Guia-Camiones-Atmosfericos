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
        pathname: "/uploads/**",
      },
      // ✅ AGREGADO: Soporte para archivos temporales
      {
        protocol: "https",
        hostname: "guia-atmosfericos.com",
        pathname: "/temp/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/uploads/**",
      },
      // ✅ AGREGADO: Soporte para archivos temporales en desarrollo
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/temp/**",
      },
    ],
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
    unoptimized: false,
  },

  async headers() {
    return [
      {
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET",
          },
        ],
      },
      // ✅ AGREGADO: Headers para archivos temporales
      {
        source: "/temp/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600", // 1 hora para archivos temporales
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET",
          },
        ],
      },
      {
        source: "/img/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/(favicon.ico|WhatsApp.svg|manifest.json|apple-icon.png)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400",
          },
        ],
      },
    ];
  },

  // ✅ AGREGADO: Configuración para servir archivos estáticos adicionales
  async rewrites() {
    return [
      // Servir archivos desde el directorio temporal si existe
      {
        source: "/temp/uploads/:path*",
        destination: "/api/serve-temp/:path*",
      },
    ];
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "@heroicons/react"],
  },

  compress: true,

  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === "development", // ✅ Solo en desarrollo
    },
  },

  // ✅ AGREGADO: Configuración adicional para archivos estáticos
  trailingSlash: false,

  // ✅ AGREGADO: Configuración de output para diferentes entornos
  ...(process.env.NODE_ENV === "production" && {
    output: "standalone",
  }),
};

export default nextConfig;
