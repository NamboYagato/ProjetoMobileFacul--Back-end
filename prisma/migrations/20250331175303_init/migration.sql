-- CreateTable
CREATE TABLE "Receita" (
    "id" SERIAL NOT NULL,
    "receita" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "ingredientes" TEXT NOT NULL,
    "modo_preparo" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receita_pkey" PRIMARY KEY ("id")
);
