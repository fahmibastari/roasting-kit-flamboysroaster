// apps/api/src/beans/dto/create-bean.dto.ts
import { IsNotEmpty, IsNumber, IsString, Min, IsOptional, IsInt } from 'class-validator';

export class CreateBeanDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  stockGB: number;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  stockRB: number;

  @IsOptional()
  @IsString()
  sackPhotoUrl?: string;
}

// Buat juga file update-bean.dto.ts di folder yang sama
export class UpdateStockDto {
  @IsNotEmpty()
  @IsNumber()
  amount: number; // Jumlah penambahan (misal: +50000 gr)
}