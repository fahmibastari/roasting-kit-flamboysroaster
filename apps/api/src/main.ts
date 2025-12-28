// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // <-- Tambah import

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Aktifkan ValidationPipe secara global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Hapus data sampah yang tidak ada di DTO
    forbidNonWhitelisted: true, // Error jika ada data sampah
    transform: true, // Otomatis ubah tipe data (misal string "123" jadi number 123)
  }));
  
  // Enable CORS agar bisa diakses dari beda domain/IP (PENTING UNTUK MOBILE)
  app.enableCors(); 

  await app.listen(4000, '0.0.0.0');
  console.log(`Backend berjalan di: http://localhost:4000`);
}
bootstrap();