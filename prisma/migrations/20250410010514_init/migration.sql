/*
  Warnings:

  - You are about to drop the column `ingredientes` on the `Receita` table. All the data in the column will be lost.
  - You are about to drop the column `modo_preparo` on the `Receita` table. All the data in the column will be lost.
  - You are about to drop the column `receita` on the `Receita` table. All the data in the column will be lost.
  - Added the required column `atualizadaEm` to the `Receita` table without a default value. This is not possible if the table is not empty.
  - Added the required column `autorId` to the `Receita` table without a default value. This is not possible if the table is not empty.
  - Added the required column `descricao` to the `Receita` table without a default value. This is not possible if the table is not empty.
  - Added the required column `titulo` to the `Receita` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `tipo` on the `Receita` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TipoReceita" AS ENUM ('BEBIDAS', 'BOLOS', 'DOCES_E_SOBREMESAS', 'FITNES', 'LANCHES', 'MASSAS', 'SALGADOS', 'SAUDAVEL', 'SOPAS');

-- AlterTable
ALTER TABLE "Receita" DROP COLUMN "ingredientes",
DROP COLUMN "modo_preparo",
DROP COLUMN "receita",
ADD COLUMN     "atualizadaEm" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "autorId" INTEGER NOT NULL,
ADD COLUMN     "descricao" TEXT NOT NULL,
ADD COLUMN     "publicada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "titulo" TEXT NOT NULL,
DROP COLUMN "tipo",
ADD COLUMN     "tipo" "TipoReceita" NOT NULL;

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Imagem" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "receitaId" INTEGER NOT NULL,

    CONSTRAINT "Imagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingrediente" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "quantidade" TEXT NOT NULL,
    "receitaId" INTEGER NOT NULL,

    CONSTRAINT "Ingrediente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Preparo" (
    "id" SERIAL NOT NULL,
    "ordemEtapa" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "receitaId" INTEGER NOT NULL,

    CONSTRAINT "Preparo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Curtida" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "receitaId" INTEGER NOT NULL,

    CONSTRAINT "Curtida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorito" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "receitaId" INTEGER NOT NULL,

    CONSTRAINT "Favorito_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Curtida_usuarioId_receitaId_key" ON "Curtida"("usuarioId", "receitaId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorito_usuarioId_receitaId_key" ON "Favorito"("usuarioId", "receitaId");

-- AddForeignKey
ALTER TABLE "Receita" ADD CONSTRAINT "Receita_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Imagem" ADD CONSTRAINT "Imagem_receitaId_fkey" FOREIGN KEY ("receitaId") REFERENCES "Receita"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingrediente" ADD CONSTRAINT "Ingrediente_receitaId_fkey" FOREIGN KEY ("receitaId") REFERENCES "Receita"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preparo" ADD CONSTRAINT "Preparo_receitaId_fkey" FOREIGN KEY ("receitaId") REFERENCES "Receita"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curtida" ADD CONSTRAINT "Curtida_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curtida" ADD CONSTRAINT "Curtida_receitaId_fkey" FOREIGN KEY ("receitaId") REFERENCES "Receita"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_receitaId_fkey" FOREIGN KEY ("receitaId") REFERENCES "Receita"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
