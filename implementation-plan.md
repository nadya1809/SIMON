# Implementation Plan SIMON PST

## 1. Ringkasan Pemahaman PRD

SIMON PST adalah aplikasi web internal untuk monitoring kinerja harian petugas PST dalam 1 kantor BPS. Sistem hanya dipakai oleh `Admin`, `Supervisor`, dan `Pimpinan`; petugas PST tidak memiliki akun login. Prioritas utama produk adalah:

1. Penilaian harian dan monitoring kinerja
2. Dashboard dan visualisasi data
3. Reward/punishment dan laporan

Stack yang disetujui:

- Next.js 14+ App Router + TypeScript
- PostgreSQL
- Prisma
- NextAuth.js Credentials
- Tailwind CSS
- Recharts

## 2. Asumsi dan Keputusan yang Sudah Bisa Dipakai

- Database final menggunakan PostgreSQL.
- Deployment target adalah on-premise tanpa Docker.
- Reminder/notifikasi tidak perlu.
- Akses mobile/PWA tidak perlu; fokus desktop responsive.
- Akun user dibuat manual oleh Admin.
- Tidak ada integrasi SSO atau sistem eksternal.
- Modul petugas harus fleksibel karena jumlah petugas dapat bertambah dan saat ini diperkirakan lebih dari 40 orang.
- Semua role login saat ini memiliki akses operasional yang sama untuk data penilaian; role tetap disimpan untuk audit, label UI, dan extensibility.

## 3. Keputusan Final yang Sudah Dikunci

Keputusan bisnis berikut sudah bisa dianggap final untuk implementasi:

1. Threshold reward dan punishment memakai default PRD:
   - `>= 8.0` untuk kandidat reward
   - `<= 4.0` untuk kandidat punishment
2. Detail reward/punishment perlu dicatat, dan kategori dibuat fleksibel agar bisa diisi sesuai kebutuhan operasional, misalnya `Reward Bulanan`, `Teguran 1`, atau `SP1`.
3. Dashboard MVP mencakup seluruh breakdown utama:
   - ranking petugas
   - tren harian, mingguan, dan bulanan
   - distribusi skor per kriteria
   - perbandingan antar unit

## 4. Strategi Implementasi

Pendekatan implementasi dibagi menjadi fase berurutan agar dependency teknis aman:

- Fondasi data dan autentikasi harus selesai dulu.
- Audit log dipasang sebelum CRUD inti agar semua perubahan tercatat dari awal.
- Fitur master data diselesaikan sebelum penilaian harian karena penilaian bergantung pada petugas dan kriteria.
- Dashboard dibangun setelah data penilaian stabil.
- Reward/punishment dan export menyusul setelah agregasi data tervalidasi.

## 5. Rencana Fase

## Fase 0 — Inisialisasi & Arsitektur

### Tujuan

Menyiapkan baseline project yang siap dikembangkan.

### Output

- Inisialisasi Next.js 14+ App Router
- Setup TypeScript strict, ESLint, Prettier
- Setup Tailwind CSS
- Setup struktur folder sesuai PRD
- Setup environment variable template

### Deliverables

- Project scaffold
- Konvensi folder `src/app`, `src/lib`, `src/components`, `prisma`
- File `.env.example`
- Dokumen setup lokal singkat

### Exit Criteria

- Project bisa jalan lokal
- Struktur repo sudah konsisten dengan PRD

## Fase 1 — Data Layer, Auth, dan Audit Foundation

### Tujuan

Membangun pondasi backend agar semua fitur berikutnya berdiri di atas schema yang stabil.

### Scope

- Implementasi `schema.prisma` sesuai source of truth PRD
- Migration PostgreSQL
- Prisma client setup
- Seed data awal:
  - 2 criteria: `Disiplin`, `Kinerja`
  - minimal 1 unit contoh
  - 1 akun admin
- NextAuth Credentials login
- Session/JWT memuat role user
- Proteksi route dashboard dan API berbasis login
- Audit log wrapper/middleware untuk CRUD penting

### Deliverables

- `prisma/schema.prisma`
- `prisma/seed.ts`
- `src/lib/prisma.ts`
- `src/lib/auth.ts`
- `src/lib/audit.ts`
- Login page dan session guard

### Exit Criteria

- User admin seed bisa login
- Database berhasil migrate
- Audit log dapat mencatat create/update/delete untuk entitas target

## Fase 2 — Master Data Management

### Tujuan

Menyiapkan data master yang menjadi fondasi operasional penilaian.

### Scope

- CRUD `Officer`
- CRUD `Criteria`
- CRUD `User`
- Opsional namun disarankan: CRUD `Unit`
- Validasi Zod untuk semua form dan endpoint
- Soft deactivation melalui `isActive` jika relevan

### Deliverables

- Halaman daftar dan form petugas
- Halaman daftar dan form kriteria
- Halaman daftar dan form user
- API routes untuk officers, criteria, users

### Catatan

- Walau criteria saat ini hanya 2 dan final, modul CRUD tetap dibuat karena PRD menginginkannya fleksibel.
- Karena jumlah petugas > 40, halaman daftar perlu filter, pencarian, dan pagination ringan atau table yang tetap nyaman dipakai.

### Exit Criteria

- Admin dapat membuat, mengubah, dan menonaktifkan petugas
- Admin dapat mengelola akun user
- Data master siap dipakai oleh form penilaian

## Fase 3 — Penilaian Harian

### Tujuan

Mengimplementasikan fitur inti prioritas tertinggi.

### Scope

- Form input penilaian harian
- List dan filter penilaian
- Edit penilaian
- Validasi business rule:
  - unique `officerId + assessmentDate`
  - status `PRESENT` atau `ABSENT`
  - skor 1–10 untuk setiap criteria aktif
  - `averageScore` dihitung otomatis
  - jika `ABSENT`, skor tidak wajib dan `averageScore = null`
- UX untuk mempermudah input harian banyak petugas

### Deliverables

- Halaman list assessment
- Halaman create/edit assessment
- API routes assessment
- Utility `scoring.ts` untuk hitung average score

### Saran Implementasi

- Pertimbangkan mode input cepat per hari agar admin/supervisor tidak perlu membuka form terpisah berulang kali untuk banyak petugas.
- Minimal MVP tetap bisa dimulai dari form per-record, lalu ditingkatkan ke batch input jika waktu cukup.

### Exit Criteria

- Semua acceptance criteria §6.1 lulus
- Record penilaian harian bisa dibuat dengan aman dan konsisten

## Fase 4 — Dashboard dan Visualisasi

### Tujuan

Menyajikan insight operasional dari data penilaian.

### Scope

- Summary cards
- Rata-rata skor per petugas
- Tren harian/mingguan/bulanan
- Ranking petugas
- Distribusi skor per kriteria
- Perbandingan antar unit
- Filter periode dan unit
- Empty state jika tidak ada data

### Deliverables

- Endpoint agregasi dashboard
- Komponen chart Recharts
- Halaman dashboard dengan filter interaktif

### Catatan Teknis

- Query agregasi perlu dioptimalkan karena target load dashboard adalah < 3 detik untuk 1 bulan data.
- Jika diperlukan, pisahkan fungsi agregasi ke service khusus agar mudah diuji.

### Exit Criteria

- Dashboard menampilkan data valid sesuai filter
- Empty state jelas saat data kosong

## Fase 5 — Reward/Punishment dan Reporting

### Tujuan

Menambahkan fitur keputusan berbasis data dan pelaporan formal.

### Scope

- Perhitungan agregat bulanan per petugas
- Generator rekomendasi reward/punishment
- Approval/reject flow manual
- Audit trail keputusan
- Export Excel
- Export PDF

### Deliverables

- Halaman reward/punishment
- Endpoint generate rekomendasi
- Endpoint approve/reject
- Endpoint export laporan
- Template PDF dan Excel

### Dependency Bisnis

- Threshold sudah dikunci di angka `>= 8.0` untuk reward dan `<= 4.0` untuk punishment.
- Kategori reward/punishment dibuat fleksibel namun tetap wajib dicatat detailnya.

### Exit Criteria

- Sistem dapat menghasilkan rekomendasi otomatis
- User dapat approve/reject
- Laporan PDF/Excel bisa diunduh untuk rentang tanggal tertentu

## Fase 6 — Hardening, Testing, dan Deployment Readiness

### Tujuan

Menjamin aplikasi stabil sebelum dipasang di server on-premise.

### Scope

- Test skenario acceptance criteria utama
- Validasi auth dan proteksi route
- Validasi audit log
- Perbaikan UX, loading state, empty state, error state
- Seed dan reset environment dev/staging
- Dokumentasi deployment on-premise
- Checklist environment PostgreSQL + PM2

### Deliverables

- Test plan berbasis acceptance criteria PRD
- Dokumen setup server
- Final QA checklist

### Exit Criteria

- Fitur P1 stabil
- Fitur P2 usable
- Build production berhasil
- Siap handoff ke tim IT untuk deployment

## 6. Prioritas Implementasi

### Prioritas Wajib untuk MVP

1. Auth dan session
2. Master data petugas
3. Penilaian harian
4. Dashboard dasar
5. Audit log

### Prioritas Menengah

1. Manajemen user lengkap
2. Dashboard breakdown lanjutan
3. Reward/punishment
4. Export PDF/Excel

### Prioritas Polish

1. Optimasi performa query
2. Batch input atau UX input cepat
3. Penyempurnaan validasi dan pesan error

## 7. Risiko dan Mitigasi

### Risiko 1 — Logic reward/punishment berkembang di tengah implementasi

Mitigasi:

- Pisahkan threshold ke config/service
- Jangan hardcode di UI dan API
- Simpan kategori sebagai field fleksibel agar tidak perlu ubah schema saat jenis tindakan bertambah

### Risiko 2 — Input harian banyak petugas menjadi lambat

Mitigasi:

- Rancang table/filter yang efisien
- Pertimbangkan batch-oriented workflow setelah MVP form tunggal stabil

### Risiko 3 — Audit log terlewat

Mitigasi:

- Pasang audit di layer terpusat sejak awal
- Uji create/update/delete pada entitas penting

### Risiko 4 — Query dashboard lambat

Mitigasi:

- Gunakan query agregasi yang terukur
- Tambahkan index bila perlu setelah data real mulai masuk

## 8. Urutan Eksekusi yang Direkomendasikan

1. Setup project dan dependency
2. Implementasi schema Prisma dan migration PostgreSQL
3. Seed awal dan login
4. Audit log
5. CRUD master data
6. Penilaian harian
7. Dashboard
8. Reward/punishment
9. Export laporan
10. Testing dan deployment readiness

## 9. Estimasi Fase

Mengacu pada PRD, estimasi realistis implementasi:

- Fase 0–1: 1 sampai 2 minggu
- Fase 2: 1 sampai 2 minggu
- Fase 3: 2 minggu
- Fase 4: 1 sampai 2 minggu
- Fase 5: 1 sampai 2 minggu
- Fase 6: 1 minggu

Total: sekitar 8 sampai 10 minggu.

## 10. File Lanjutan yang Disarankan Setelah Planning Ini

Setelah planning disetujui, langkah berikut yang paling membantu adalah membuat:

1. `task-breakdown.md`
   Berisi daftar task implementasi rinci per fase.
2. `database-decisions.md`
   Berisi keputusan schema tambahan, indexing, dan seed strategy.
3. `test-scenarios.md`
   Berisi turunan test case dari acceptance criteria PRD.
