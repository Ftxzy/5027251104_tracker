const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.matkul.createMany({
    data: [
      { kode: 'ET234305', nama: 'Pemrograman Web', sks: 4, semester: 3 },
      { kode: 'ET234302', nama: 'Basis Data', sks: 3, semester: 3 },
      { kode: 'ET234303', nama: 'Struktur Data', sks: 3, semester: 3 },
      { kode: 'ET234304', nama: 'Jaringan Komputer', sks: 3, semester: 3 },
      { kode: 'ET234301', nama: 'Statistika', sks: 2, semester: 3 },
    ],
    skipDuplicates: true,
  });
  console.log('Seed selesai — 5 mata kuliah tersimpan');
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
