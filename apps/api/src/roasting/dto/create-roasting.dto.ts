// apps/api/src/roasting/dto/create-roasting.dto.ts
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, IsInt } from 'class-validator';

export class CreateRoastingDto {
  @IsNotEmpty()
  @IsUUID()
  beanTypeId: string; // ID Kopi yang dipilih

  @IsNotEmpty()
  @IsUUID()
  roasterId: string; // ID User yang sedang login (Nanti kita hardcode dulu)

  @IsNotEmpty()
  @IsInt()
  @Min(100) // Minimal roasting 100 gram biar masuk akal
  initialWeight: number; // Berat GB yang dipakai (gram)

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  batchNumber: number; // Batch ke berapa hari ini

  @IsOptional() // Boleh kosong
  @IsNumber()
  density?: number;

  @IsOptional() // Boleh kosong
  @IsString()
  targetProfile?: string;
}