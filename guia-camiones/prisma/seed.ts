import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.usuario.upsert({
    where: { email: "admin@email.com" },
    update: {},
    create: {
      nombre: "Admin",
      email: "admin@email.com",
      password: hashedPassword,
      rol: "ADMIN",
    },
  });

  console.log("✅ Usuario ADMIN creado:", admin.email);
}

main()
  .catch((e) => {
    console.error("❌ Error en el seed:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
