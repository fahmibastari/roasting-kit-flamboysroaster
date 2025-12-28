// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // <--- 1. Import ini
import { APP_GUARD } from '@nestjs/core'; // <--- Import ini
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { BeansModule } from './beans/beans.module';
import { RoastingModule } from './roasting/roasting.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module'; // <--- Import ini
import { JwtAuthGuard } from './auth/jwt-auth.guard'; // <--- Import ini

@Module({
  imports: [
    // 2. Tambahkan baris ini PALING ATAS di dalam imports
    ConfigModule.forRoot({
      isGlobal: true, // Agar .env bisa dibaca di semua service
    }),

    PrismaModule,
    BeansModule,
    RoastingModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }