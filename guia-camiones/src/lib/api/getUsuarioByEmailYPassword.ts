import { prisma } from "@/lib/db";

export const getUsuarioByEmailYPassword = async (
  email: string,
  password: string
) => {
  const user = await prisma.usuario.findUnique({
    where: { email },
  });

  if (!user || user.password !== password) {
    return null;
  }

  return user;
};
