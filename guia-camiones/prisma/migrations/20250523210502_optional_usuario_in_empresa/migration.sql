-- DropForeignKey
ALTER TABLE "Empresa" DROP CONSTRAINT "Empresa_usuarioId_fkey";

-- AlterTable
ALTER TABLE "Empresa" ALTER COLUMN "usuarioId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Empresa" ADD CONSTRAINT "Empresa_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
