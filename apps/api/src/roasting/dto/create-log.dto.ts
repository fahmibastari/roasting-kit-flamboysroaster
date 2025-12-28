// apps/api/src/roasting/dto/create-log.dto.ts
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateLogDto {
  @IsNotEmpty()
  @IsNumber()
  timeIndex: number; // Detik ke: 30, 60, 90...

  @IsNotEmpty()
  @IsNumber()
  temperature: number; // Suhu bean

  @IsNotEmpty()
  @IsNumber()
  airflow: number; // 0, 25, 50, 75, 100

  @IsOptional()
  @IsBoolean()
  isFirstCrack?: boolean; // Apakah ini momen First Crack?
}