import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRoastingDto } from './dto/create-roasting.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLogDto } from './dto/create-log.dto';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class RoastingService {
  private supabase: any;

  constructor(private prisma: PrismaService) {
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sbKey = process.env.SUPABASE_SERVICE_KEY;

    if (!sbUrl || !sbKey) {
      console.error("❌ SUPABASE CONFIG MISSING!");
      console.error("URL:", sbUrl);
      // Only show first 10 chars of key for safety
      console.error("KEY:", sbKey ? sbKey.substring(0, 10) + '...' : 'undefined');
    } else {
      console.log("✅ Supabase Client Initialized with URL:", sbUrl);
      // Debug: Log key prefix to check for quotes or weird chars
      console.log("✅ Supabase Key Prefix:", sbKey.substring(0, 5));
    }

    this.supabase = createClient(sbUrl!, sbKey!);
  }

  // 1. MULAI ROASTING (Potong Stok GB)
  async create(data: CreateRoastingDto) {
    return this.prisma.$transaction(async (tx) => {
      const bean = await tx.beanType.findUnique({ where: { id: data.beanTypeId } });
      if (!bean) throw new BadRequestException('Jenis kopi tidak ditemukan.');

      if (bean.stockGB < data.initialWeight) {
        throw new BadRequestException(`Stok GB tidak cukup! Sisa: ${bean.stockGB}, Diminta: ${data.initialWeight}`);
      }

      // Potong Stok GB
      await tx.beanType.update({
        where: { id: data.beanTypeId },
        data: { stockGB: bean.stockGB - data.initialWeight },
      });

      // Buat Batch
      return tx.roastBatch.create({
        data: {
          batchNumber: data.batchNumber,
          initialWeight: data.initialWeight,
          density: data.density,         // <--- Density Masuk Sini
          targetProfile: data.targetProfile, // <--- Target Profile Masuk Sini
          estimatedYield: Math.round(data.initialWeight * 0.7), // Estimasi Awal
          isStockUpdated: false,
          beanType: { connect: { id: data.beanTypeId } },
          roaster: { connect: { id: data.roasterId } },
        },
        include: { beanType: true, roaster: true }
      });
    });
  }

  // 2. CATAT LOG
  async addLog(batchId: string, data: CreateLogDto) {
    return this.prisma.roastLog.create({
      data: {
        batchId: batchId,
        timeIndex: data.timeIndex,
        temperature: data.temperature,
        airflow: data.airflow,
        isFirstCrack: data.isFirstCrack || false,
      },
    });
  }

  // 3. SELESAI & UPLOAD (Tambah Stok RB Otomatis)
  async finishRoasting(id: string, finalTime: string, finalTemp: number, file?: Express.Multer.File) {
    console.log(`🏁 START FINISH ROASTING: ID=${id}, Time=${finalTime}, Temp=${finalTemp}`);

    let publicUrl = null;

    if (file) {
      console.log(`📸 File Received: ${file.originalname} (${file.size} bytes), Mime: ${file.mimetype}`);

      const fileExt = file.originalname.split('.').pop() || 'jpg';
      const fileName = `${id}-${Date.now()}.${fileExt}`;
      console.log(`📤 Uploading to Supabase path: ${fileName}`);

      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('roasting-proof')
        .upload(fileName, file.buffer, { contentType: file.mimetype });

      if (uploadError) {
        console.error("❌ Supabase Upload Error:", uploadError);
        // Kita log error tapi TIDAK throw exception agar data roasting tetap tersimpan?
        // Atau throw? Untuk aman, throw saja dulu.
        throw new BadRequestException(`Gagal upload foto ke Supabase: ${uploadError.message}`);
      }
      console.log("✅ Upload Success. Data:", uploadData);

      const { data: urlData } = this.supabase.storage
        .from('roasting-proof').getPublicUrl(fileName);
      console.log("🔗 Public URL:", urlData.publicUrl);
      publicUrl = urlData.publicUrl;
    } else {
      console.log("⚠️ No photo uploaded. Skipping Supabase upload.");
    }

    // B. LOGIKA STOK OTOMATIS
    const batch = await this.prisma.roastBatch.findUnique({ where: { id } });
    if (!batch) {
      console.error(`❌ Batch ${id} not found in DB`);
      throw new BadRequestException('Batch hilang');
    }

    // Hitung Real Yield
    const yieldWeight = Math.round(batch.initialWeight * 0.7);
    console.log(`⚖️  Yield Calculation: ${batch.initialWeight} * 0.7 = ${yieldWeight}`);

    // Update Stok RB di BeanType (+ Yield)
    const updateBean = await this.prisma.beanType.update({
      where: { id: batch.beanTypeId },
      data: { stockRB: { increment: yieldWeight } }
    });
    console.log(`✅ Stock Updated. New StockRB: ${updateBean.stockRB}`);

    // C. Update Batch (Finalize)
    const updatedBatch = await this.prisma.roastBatch.update({
      where: { id },
      data: {
        finalTime: finalTime,
        finalTemp: finalTemp,
        resultPhotoUrl: publicUrl, // Bisa null
        actualYield: yieldWeight,
        isStockUpdated: true
      },
    });
    console.log("✅ Batch Finalized & Persisted:", updatedBatch);
    return updatedBatch;
  }

  async findAll() {
    return this.prisma.roastBatch.findMany({
      orderBy: { createdAt: 'desc' },
      include: { beanType: true, roaster: true },
    });
  }

  async findInProgress(roasterId: string) {
    return this.prisma.roastBatch.findFirst({
      where: {
        roasterId: roasterId,
        finalTime: null, // Masih jalan
      },
      orderBy: { createdAt: 'desc' }, // Ambil yang paling baru
      include: { beanType: true } // Butuh nama bean utk UI
    });
  }

  async findOne(id: string) {
    return this.prisma.roastBatch.findUnique({
      where: { id },
      include: { beanType: true, roaster: true, logs: { orderBy: { timeIndex: 'asc' } } },
    });
  }

  async updateQC(id: string, score: number, notes: string, isApproved: boolean) {
    return this.prisma.roastBatch.update({
      where: { id },
      data: { cuppingScore: score, sensoryNotes: notes, isApproved: isApproved }
    });
  }
}