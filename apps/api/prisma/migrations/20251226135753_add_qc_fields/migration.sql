-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'ROASTER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ROASTER',
    "fullName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeanType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stockGB" INTEGER NOT NULL DEFAULT 0,
    "sackPhotoUrl" TEXT,
    "stockRB" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BeanType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoastBatch" (
    "id" TEXT NOT NULL,
    "batchNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "initialWeight" INTEGER NOT NULL,
    "density" DOUBLE PRECISION,
    "targetProfile" TEXT,
    "finalTime" TEXT,
    "finalTemp" INTEGER,
    "resultPhotoUrl" TEXT,
    "cuppingScore" DOUBLE PRECISION DEFAULT 0,
    "sensoryNotes" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "estimatedYield" INTEGER,
    "actualYield" INTEGER,
    "isStockUpdated" BOOLEAN NOT NULL DEFAULT false,
    "roasterId" TEXT NOT NULL,
    "beanTypeId" TEXT NOT NULL,

    CONSTRAINT "RoastBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoastLog" (
    "id" TEXT NOT NULL,
    "timeIndex" INTEGER NOT NULL,
    "temperature" INTEGER NOT NULL,
    "airflow" INTEGER NOT NULL,
    "isFirstCrack" BOOLEAN NOT NULL DEFAULT false,
    "batchId" TEXT NOT NULL,

    CONSTRAINT "RoastLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "BeanType_name_key" ON "BeanType"("name");

-- CreateIndex
CREATE INDEX "RoastLog_batchId_idx" ON "RoastLog"("batchId");

-- AddForeignKey
ALTER TABLE "RoastBatch" ADD CONSTRAINT "RoastBatch_roasterId_fkey" FOREIGN KEY ("roasterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoastBatch" ADD CONSTRAINT "RoastBatch_beanTypeId_fkey" FOREIGN KEY ("beanTypeId") REFERENCES "BeanType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoastLog" ADD CONSTRAINT "RoastLog_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "RoastBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
