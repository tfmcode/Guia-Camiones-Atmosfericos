import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express"; // O de 'next' si usás Next API Routes

// Middleware dinámico para empresa específica
export function createMulterEmpresaUpload(empresaId: number) {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "empresa", String(empresaId));

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: function (
      _req: Request,
      _file: Express.Multer.File,
      cb: (error: Error | null, destination: string) => void
    ) {
      cb(null, uploadDir);
    },
    filename: function (
      _req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, filename: string) => void
    ) {
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext).replace(/\s+/g, "-");
      const unique = Date.now();
      cb(null, `${name}-${unique}${ext}`);
    },
  });

  return multer({ storage });
}
