// apps/api/src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt'; // <--- Import ini

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  // 1. REGISTER USER BARU (DENGAN HASH)
  async create(data: any) {
    // Enkripsi password sebelum disimpan
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        username: data.username,
        fullName: data.fullName,
        password: hashedPassword, // <--- Simpan yang sudah di-hash
        role: 'ROASTER'
      }
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      where: { role: 'ROASTER' },
      select: { id: true, fullName: true, username: true }
    });
  }

  async findOneByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }

  // 2. UPDATE USER
  async update(id: string, data: any) {
    const updateData: any = {
      fullName: data.fullName,
      username: data.username
    };

    // Only hash password if provided and not empty
    if (data.password && data.password.trim() !== '') {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData
    });
  }

  // 3. DELETE USER
  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}