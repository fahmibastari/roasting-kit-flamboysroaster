import { Injectable } from '@nestjs/common';
import { CreateBeanDto } from './dto/create-bean.dto';
import { UpdateBeanDto } from './dto/update-bean.dto';
import { PrismaService } from '../prisma/prisma.service';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class BeansService {
  private supabase: any;

  constructor(private prisma: PrismaService) {
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sbKey = process.env.SUPABASE_SERVICE_KEY;
    this.supabase = createClient(sbUrl!, sbKey!);
  }

  async create(createBeanDto: CreateBeanDto, file?: Express.Multer.File) {
    let photoUrl = undefined;

    if (file) {
      console.log(`📸 Create Bean: Uploading Sack Photo...`);
      const fileExt = file.originalname.split('.').pop() || 'jpg';
      const fileName = `sack-new-${Date.now()}.${fileExt}`;

      const { data, error } = await this.supabase.storage
        .from('roasting-proof')
        .upload(fileName, file.buffer, { contentType: file.mimetype });

      if (!error) {
        const { data: urlData } = this.supabase.storage.from('roasting-proof').getPublicUrl(fileName);
        photoUrl = urlData.publicUrl;
      }
    }

    return this.prisma.beanType.create({
      data: {
        ...createBeanDto,
        sackPhotoUrl: photoUrl
      }
    });
  }

  findAll() {
    return this.prisma.beanType.findMany({ orderBy: { name: 'asc' } });
  }

  // UPDATE DI SINI: Include batches (riwayat roasting)
  findOne(id: string) {
    return this.prisma.beanType.findUnique({
      where: { id },
      include: {
        batches: {
          orderBy: { createdAt: 'desc' }, // Urutkan dari yang terbaru
          include: { roaster: true }      // Sertakan nama roaster
        }
      }
    });
  }

  update(id: string, updateBeanDto: UpdateBeanDto) {
    return this.prisma.beanType.update({
      where: { id },
      data: updateBeanDto,
    });
  }

  async restock(id: string, amount: number, type: 'GB' | 'RB' = 'GB', file?: Express.Multer.File) {
    let photoUrl: string | undefined = undefined;

    if (file) {
      console.log(`📸 Restock: Uploading Sack Photo...`);
      const fileExt = file.originalname.split('.').pop() || 'jpg';
      const fileName = `sack-${id}-${Date.now()}.${fileExt}`;

      const { data, error } = await this.supabase.storage
        .from('roasting-proof') // Reuse same bucket or different one? Roasting-proof is fine.
        .upload(fileName, file.buffer, { contentType: file.mimetype });

      if (error) {
        console.error("❌ Stock Photo Upload Failed:", error);
        // Continue without photo update if fail, or throw? Let's log and continue for now.
      } else {
        const { data: urlData } = this.supabase.storage.from('roasting-proof').getPublicUrl(fileName);
        photoUrl = urlData.publicUrl;
        console.log("✅ Stock Photo Uploaded:", photoUrl);
      }
    }

    const dataToUpdate: any = {};
    if (type === 'RB') {
      dataToUpdate.stockRB = { increment: amount };
    } else {
      dataToUpdate.stockGB = { increment: amount };
    }

    if (photoUrl) {
      dataToUpdate.sackPhotoUrl = photoUrl;
    }

    return this.prisma.beanType.update({
      where: { id },
      data: dataToUpdate
    });
  }

  async remove(id: string) {
    // Manual Cascade Delete via Transaction
    // 1. Find all batches for this bean to get their IDs
    const batches = await this.prisma.roastBatch.findMany({
      where: { beanTypeId: id },
      select: { id: true }
    });

    const batchIds = batches.map(b => b.id);

    return this.prisma.$transaction([
      // 2. Delete all logs associated with these batches
      this.prisma.roastLog.deleteMany({
        where: { batchId: { in: batchIds } }
      }),
      // 3. Delete the batches themselves
      this.prisma.roastBatch.deleteMany({
        where: { beanTypeId: id }
      }),
      // 4. Finally, delete the bean type
      this.prisma.beanType.delete({
        where: { id }
      })
    ]);
  }
}