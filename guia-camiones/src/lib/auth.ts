import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export function signJwt(payload: {
  id: number;
  email: string;
  rol: "ADMIN" | "EMPRESA" | "USUARIO";
}) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });
}

export function verifyJwt(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      id: number;
      email: string;
      rol: "ADMIN" | "EMPRESA" | "USUARIO";
    };
  } catch {
    return null;
  }
}
