import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("admin123", 10);

  const admin = await prisma.usuario.upsert({
    where: { email: "admin@email.com" },
    update: {},
    create: {
      nombre: "Administrador",
      email: "admin@email.com",
      password,
      rol: "ADMIN",
    },
  });

  console.log("Usuario administrador creado:", admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
