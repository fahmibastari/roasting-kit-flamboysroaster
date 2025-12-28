// apps/api/prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt'; // <--- 1. TAMBAH INI

const prisma = new PrismaClient();

// --- HELPER: GENERATE LOG SUHU REALISTIS ---
function generateRoastLogs(batchId: string, durationMinutes: number, finalTemp: number) {
  const logs: any[] = [];
  const durationSeconds = durationMinutes * 60;

  const chargeTemp = 200;
  const turningPointTime = 60;
  const turningPointTemp = 95;
  const firstCrackTime = durationSeconds - 120;
  const firstCrackTemp = 196;

  for (let t = 0; t <= durationSeconds; t += 30) {
    let temp = 0;
    let airflow = 0;
    let isFC = false;

    if (t <= turningPointTime) {
      const progress = t / turningPointTime;
      temp = chargeTemp - ((chargeTemp - turningPointTemp) * progress);
      airflow = 0;
    }
    else if (t <= firstCrackTime) {
      const progress = (t - turningPointTime) / (firstCrackTime - turningPointTime);
      temp = turningPointTemp + ((firstCrackTemp - turningPointTemp) * progress);
      airflow = 50;
    }
    else {
      const progress = (t - firstCrackTime) / (durationSeconds - firstCrackTime);
      temp = firstCrackTemp + ((finalTemp - firstCrackTemp) * progress);
      airflow = 100;
      if (t === firstCrackTime) isFC = true;
    }

    logs.push({
      batchId,
      timeIndex: t,
      temperature: Math.round(temp),
      airflow: airflow,
      isFirstCrack: isFC
    });
  }
  return logs;
}

async function main() {
  console.log('🔥 Menghapus data lama...');
  await prisma.roastLog.deleteMany();
  await prisma.roastBatch.deleteMany();
  await prisma.beanType.deleteMany();
  await prisma.user.deleteMany();

  console.log('🌱 Membuat Users...');

  // 2. GENERATE HASH FRESH DI SINI (JANGAN HARDCODE)
  const passwordHash = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.create({
    data: { username: 'admin', fullName: 'Head Roaster (Boss)', role: Role.ADMIN, password: passwordHash }
  });

  const budi = await prisma.user.create({
    data: { username: 'budi', fullName: 'Budi Santoso (Senior)', role: Role.ROASTER, password: passwordHash }
  });

  const siti = await prisma.user.create({
    data: { username: 'siti', fullName: 'Siti Aminah (Junior)', role: Role.ROASTER, password: passwordHash }
  });

  console.log('🌱 Membuat Inventory Beans...');
  const beansData = [
    { name: 'Aceh Gayo Wine', stockGB: 45000, stockRB: 2000, color: 'purple' },
    { name: 'Bali Kintamani', stockGB: 12000, stockRB: 500, color: 'orange' },
    { name: 'Toraja Sapan', stockGB: 8500, stockRB: 0, color: 'brown' },
    { name: 'Ethiopia Yirgacheffe', stockGB: 20000, stockRB: 4000, color: 'yellow' },
    { name: 'Brazil Cerrado', stockGB: 60000, stockRB: 10000, color: 'green' },
    { name: 'Robusta Lampung', stockGB: 100000, stockRB: 15000, color: 'red' },
  ];

  const beansMap: Record<string, string> = {};

  for (const b of beansData) {
    const bean = await prisma.beanType.create({
      data: {
        name: b.name,
        stockGB: b.stockGB,
        stockRB: b.stockRB,
        sackPhotoUrl: `https://placehold.co/600x400/${b.color}/white?text=${encodeURIComponent(b.name)}`,
      }
    });
    beansMap[b.name] = bean.id;
  }

  console.log('☕ Mulai Roasting Massal (Generating Batches)...');

  const batchesToCreate = [
    {
      bean: 'Aceh Gayo Wine', roaster: budi.id, dateOffset: -7,
      in: 3000, out: 2450, time: '12:30', temp: 208,
      score: 88.5, notes: 'Complex acidity, jackfruit aroma strong, body medium.', approved: true
    },
    {
      bean: 'Ethiopia Yirgacheffe', roaster: admin.id, dateOffset: -6,
      in: 2000, out: 1600, time: '11:00', temp: 212,
      score: 84.0, notes: 'Floral hints, but slight scorched tip. A bit too dark for filter.', approved: true
    },
    {
      bean: 'Robusta Lampung', roaster: siti.id, dateOffset: -5,
      in: 5000, out: 4100, time: '15:00', temp: 218,
      score: 80.0, notes: 'Bold, dark chocolate, bitter finish. Good for Es Kopi Susu.', approved: true
    },
    {
      bean: 'Toraja Sapan', roaster: siti.id, dateOffset: -3,
      in: 3000, out: 2300, time: '18:00', temp: 225,
      score: 65.0, notes: 'BAKED. Rasa datar, aroma hilang. Api kekecilan di awal.', approved: false
    },
    {
      bean: 'Brazil Cerrado', roaster: budi.id, dateOffset: -2,
      in: 10000, out: 8200, time: '14:20', temp: 210,
      score: 85.0, notes: 'Nutty, Caramel sweetness. Standard espresso profile.', approved: true
    },
    {
      bean: 'Aceh Gayo Wine', roaster: siti.id, dateOffset: 0,
      in: 1000, out: 810, time: '10:45', temp: 206,
      score: 0, notes: '', approved: false
    },
    { bean: 'Bali Kintamani', roaster: admin.id, dateOffset: -10, in: 2500, out: 2000, time: '12:00', temp: 207, score: 86, notes: 'Citrusy, clean.', approved: true },
    { bean: 'Bali Kintamani', roaster: budi.id, dateOffset: -9, in: 2500, out: 2050, time: '12:10', temp: 208, score: 86.5, notes: 'Consistent.', approved: true },
    { bean: 'Robusta Lampung', roaster: siti.id, dateOffset: -1, in: 5000, out: 4000, time: '14:50', temp: 220, score: 79, notes: 'Rubber notes minimal.', approved: true },
  ];

  let batchCounter = 1;

  for (const b of batchesToCreate) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() + b.dateOffset);

    const batch = await prisma.roastBatch.create({
      data: {
        batchNumber: batchCounter++,
        initialWeight: b.in,
        estimatedYield: Math.round(b.in * 0.7), // Update Estimasi 30%
        actualYield: b.out,
        finalTime: b.time,
        finalTemp: b.temp,
        targetProfile: b.bean.includes('Robusta') ? 'Dark Roast - Espresso' : 'Light - Filter',
        density: null,

        cuppingScore: b.score,
        sensoryNotes: b.notes,
        isApproved: b.approved,
        isStockUpdated: true,
        resultPhotoUrl: `https://placehold.co/600x400/3e2723/white?text=Roast+${encodeURIComponent(b.bean)}`,

        createdAt: createdAt,
        beanTypeId: beansMap[b.bean],
        roasterId: b.roaster,
      }
    });

    const [mm, ss] = b.time.split(':').map(Number);
    const durationMin = mm + (ss / 60);
    const logs = generateRoastLogs(batch.id, durationMin, b.temp);

    await prisma.roastLog.createMany({ data: logs });
  }

  console.log(`✅ Berhasil membuat ${batchesToCreate.length} batch simulasi.`);
  console.log('🚀 DATABASE SIAP DIGUNAKAN! (Admin/Budi/Siti : 123456)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });