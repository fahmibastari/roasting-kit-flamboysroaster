// apps/api/src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // PENTING: Biar bisa diakses di semua tempat tanpa import ulang
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}