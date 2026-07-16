# SIo

ON PST

SIMON PST adalah aplikasi internal untuk monitoring kinerja harian petugas Pelayanan Statistik Terpadu. Stack utama proyek ini memakai Next.js App Router, TypeScript, Prisma, PostgreSQL, NextAuth, dan `pnpm`.

## Fitur Utama

- Login berbasis kredensial untuk `ADMIN`, `SUPERVISOR`, dan `PIMPINAN`
- Master data unit, petugas PST, kriteria, dan user
- Penilaian harian dengan status `PRESENT` dan `ABSENT`
- Dashboard monitoring kinerja
- Reward dan punishment berbasis agregasi bulanan
- Export laporan PDF dan Excel

## Prasyarat

- Node.js 20 atau lebih baru
- `pnpm` 10
- PostgreSQL aktif dan bisa diakses dari aplikasi

## Setup Lokal

1. Masuk ke folder project.
2. Salin file environment.
3. Install dependency.
4. Generate Prisma client.
5. Jalankan migration.
6. Seed data awal.
7. Jalankan server development.

```powershell
cd C:\dev\simon
Copy-Item .env.example .env
pnpm install
pnpm prisma generate
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev
```

Setelah server jalan:

- di PC server, buka `http://localhost:3000`
- di PC lain satu jaringan, buka `http://10.13.20.119:3000`

## Konfigurasi Environment

Variabel minimum yang perlu diisi:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/simon_pst"
NEXTAUTH_SECRET="ganti-dengan-secret-yang-aman"
NEXTAUTH_URL="http://10.13.20.119:3000"
SEED_ADMIN_NAME="Admin SIMON"
SEED_ADMIN_EMAIL="admin@simon.local"
SEED_ADMIN_PASSWORD="ChangeMe123!"
SEED_DEFAULT_UNIT_NAME="PST Utama"
```

## Database PostgreSQL

Contoh setup database lokal:

```sql
CREATE DATABASE simon_pst;
```

Jika ingin membuat user khusus:

```sql
CREATE USER simon_user WITH PASSWORD 'ChangeMe123!';
GRANT ALL PRIVILEGES ON DATABASE simon_pst TO simon_user;
```

Lalu sesuaikan `DATABASE_URL` di `.env`.

## Seed Default

Seed akan menyiapkan:

- 1 unit default
- 2 kriteria default: `Disiplin` dan `Kinerja`
- 1 akun admin awal

Kredensial admin mengikuti nilai di `.env`.

## Perintah Penting

```powershell
pnpm dev
pnpm lint
pnpm build
pnpm import:officers
pnpm prisma generate
pnpm prisma:migrate
pnpm prisma:deploy
pnpm prisma:seed
```

## Import Petugas PST

Untuk mengimpor daftar petugas dari file jadwal piket Excel:

```powershell
pnpm import:officers "C:\Users\Asus\Downloads\JADWAL PIKET PST BPS PROVINSI SUMATERA BARAT 2026 (1).xlsx"
```

Catatan:

- Script membaca sheet `Pegawai`
- Data dicocokkan berdasarkan `NIP`
- Jika `NIP` sudah ada, data petugas akan di-update
- Jika `NIP` belum ada, data petugas akan dibuat baru
- Pastikan nama unit di Excel sesuai dengan master unit di aplikasi

## Deployment Internal

Langkah deployment produksi sederhana:

```powershell
pnpm install
pnpm prisma generate
pnpm prisma:deploy
pnpm prisma:seed
pnpm build
pnpm start
```

Jika memakai PM2:

```powershell
pm2 start pnpm --name simon-pst -- start
pm2 save
```

Untuk update versi aplikasi:

```powershell
git pull
pnpm install
pnpm prisma generate
pnpm prisma:deploy
pnpm build
pm2 restart simon-pst
```

## Catatan

- Gunakan folder kerja seperti `C:\dev\simon` agar tidak bentrok dengan proteksi folder Windows di `Documents`.
- File `.env` tidak boleh di-commit.
