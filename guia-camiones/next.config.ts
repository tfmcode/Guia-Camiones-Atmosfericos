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
        port: "", // se puede omitir, pero es más explícito
        pathname: "/uploads/empresa/**",
      },
    ],
  },
};

export default nextConfig;
