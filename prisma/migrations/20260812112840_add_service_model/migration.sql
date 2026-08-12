-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);
