# Task Breakdown SIMON PST

## Tujuan Dokumen

Dokumen ini memecah `implementation-plan.md` menjadi task implementasi yang lebih rinci dan bisa dipakai sebagai checklist kerja. Urutannya mengikuti dependency teknis agar build berjalan aman dan progres mudah dipantau.

## Status Legend

- `[ ]` belum dikerjakan
- `[~]` sedang dikerjakan
- `[x]` selesai

## Fase 0 — Inisialisasi Proyek `[x]`

### Setup project

- [x] Inisialisasi project Next.js 14+ dengan App Router, TypeScript, dan Tailwind CSS
- [x] Rapikan struktur folder dasar sesuai PRD
- [x] Aktifkan TypeScript strict mode
- [x] Tambahkan ESLint config
- [x] Buat `.env.example`
- [x] Tambahkan `.gitignore` yang sesuai untuk Next.js, Prisma, dan env files

### Dependency install

- [x] Install runtime dependency:
  - `@prisma/client`
  - `next-auth`
  - `bcryptjs`
  - `zod`
  - `react-hook-form`
  - `@hookform/resolvers`
  - `recharts`
  - `exceljs`
  - `@react-pdf/renderer`
- [x] Install dev dependency:
  - `prisma`
  - types package yang dibutuhkan

### Konfigurasi awal

- [ ] Buat file util dasar `src/lib/utils.ts` jika diperlukan
- [x] Siapkan alias import bila diperlukan
- [ ] Tambahkan README setup lokal singkat

## Fase 1 — Database, Prisma, dan Auth Foundation `[~]`

### Prisma schema

- [x] Inisialisasi Prisma
- [x] Tempel dan sesuaikan `prisma/schema.prisma` dengan source of truth PRD
- [x] Review ulang relasi dan enum:
  - `Role`
  - `RewardPunishmentType`
  - `RewardPunishmentStatus`
  - `AttendanceStatus`
  - `AuditAction`
- [x] Pastikan unique constraint `officerId + assessmentDate` terpasang
- [x] Pastikan unique constraint `dailyAssessmentId + criteriaId` terpasang
- [x] Tambahkan index yang sudah jelas dibutuhkan sejak awal

### Database setup

- [x] Siapkan koneksi PostgreSQL melalui `DATABASE_URL`
- [ ] Jalankan migration awal
- [x] Generate Prisma client
- [x] Verifikasi schema dapat dibuat tanpa error

### Seed data

- [x] Buat `prisma/seed.ts`
- [x] Seed minimal 1 `Unit`
- [x] Seed 2 `Criteria` default:
  - `Disiplin`
  - `Kinerja`
- [x] Seed 1 user admin awal
- [x] Hash password admin seed dengan aman
- [x] Pastikan seed aman dijalankan berulang jika diperlukan

### Prisma client integration

- [x] Buat `src/lib/prisma.ts`
- [x] Pastikan singleton Prisma aman untuk development hot reload

### Auth setup

- [x] Buat `src/lib/auth.ts`
- [x] Konfigurasi NextAuth Credentials provider
- [x] Validasi login dengan email dan password
- [x] Cocokkan password menggunakan bcrypt
- [x] Simpan `id`, `name`, `email`, dan `role` ke JWT/session
- [x] Batasi login untuk user `isActive = false`

### Auth UI

- [x] Buat halaman login `src/app/(auth)/login/page.tsx`
- [x] Tambahkan form login berbahasa Indonesia
- [x] Tampilkan error login yang jelas
- [x] Redirect user yang berhasil login ke dashboard

### Route protection

- [x] Proteksi seluruh route dashboard
- [x] Proteksi route API yang butuh autentikasi
- [x] Tambahkan helper `requireAuth` untuk route handler
- [x] Pastikan user belum login diarahkan ke halaman login

## Fase 1.5 — Audit Log Foundation

### Audit architecture

- [ ] Buat `src/lib/audit.ts`
- [ ] Tentukan pendekatan audit terpusat:
  - Prisma middleware
  - atau wrapper service yang konsisten
- [ ] Pastikan audit minimal mencatat:
  - user
  - action
  - entity
  - entityId
  - beforeData
  - afterData
  - createdAt

### Audit integration

- [ ] Pasang audit untuk create/update/delete `DailyAssessment`
- [ ] Pasang audit untuk create/update/delete `RewardPunishment`
- [ ] Pertimbangkan juga audit untuk `Officer`, `Criteria`, dan `User`
- [ ] Pastikan operasi gagal tidak membuat audit palsu

### Audit verification

- [ ] Uji create menghasilkan audit log
- [ ] Uji update menghasilkan before/after data
- [ ] Uji delete menghasilkan jejak perubahan yang cukup

## Fase 2 — Layout Aplikasi dan Shared UI `[x]`

### Dashboard shell

- [x] Buat layout dashboard `src/app/(dashboard)/layout.tsx`
- [x] Buat sidebar navigasi utama
- [x] Tambahkan topbar sederhana
- [x] Tampilkan identitas user login
- [x] Tambahkan tombol logout

### Shared components

- [x] Buat komponen UI dasar:
  - button
  - input
  - select
  - textarea
  - badge
  - table
  - dialog atau modal
  - date picker atau input tanggal
- [x] Buat komponen state:
  - loading state
  - empty state
  - error state
  - success feedback

### Form foundation

- [x] Siapkan pola reusable untuk form dengan React Hook Form + Zod
- [x] Siapkan helper error message form
- [x] Pastikan semua label UI memakai Bahasa Indonesia

## Fase 3 — Master Data Unit

### Backend

- [ ] Buat endpoint `GET /api/units`
- [ ] Buat endpoint `POST /api/units`
- [ ] Buat endpoint `PATCH /api/units/[id]`
- [ ] Tentukan apakah `DELETE` dihindari dan diganti nonaktif/edit saja
- [ ] Tambahkan validasi Zod untuk unit

### Frontend

- [ ] Buat halaman daftar unit
- [ ] Buat form tambah/edit unit
- [ ] Tampilkan relasi jumlah petugas per unit jika memungkinkan

### Verifikasi

- [ ] Admin dapat menambah unit
- [ ] Admin dapat mengubah data unit

## Fase 4 — Master Data Petugas

### Backend

- [ ] Buat schema validasi petugas
- [ ] Buat endpoint `GET /api/officers`
- [ ] Tambahkan filter:
  - pencarian nama
  - pencarian NIP
  - filter unit
  - filter status aktif
- [ ] Buat endpoint `POST /api/officers`
- [ ] Buat endpoint `GET /api/officers/[id]`
- [ ] Buat endpoint `PATCH /api/officers/[id]`
- [ ] Buat endpoint nonaktifkan petugas
- [ ] Pastikan `nip` unik

### Frontend

- [ ] Buat halaman daftar petugas
- [ ] Buat table petugas dengan pencarian dan filter
- [ ] Buat form tambah petugas
- [ ] Buat form edit petugas
- [ ] Tampilkan badge aktif/nonaktif
- [ ] Buat detail singkat petugas jika diperlukan

### UX untuk skala 40+ petugas

- [ ] Tambahkan pagination atau limit rows
- [ ] Buat sorting nama/NIP/unit
- [ ] Pastikan daftar tetap ringan dan mudah dipakai

### Verifikasi

- [ ] Admin dapat CRUD petugas
- [ ] Data petugas siap dipakai di penilaian

## Fase 5 — Master Data Kriteria

### Backend

- [ ] Buat endpoint `GET /api/criteria`
- [ ] Buat endpoint `POST /api/criteria`
- [ ] Buat endpoint `PATCH /api/criteria/[id]`
- [ ] Pastikan `sortOrder` didukung
- [ ] Pastikan kriteria bisa dinonaktifkan

### Frontend

- [ ] Buat halaman daftar kriteria
- [ ] Buat form tambah/edit kriteria
- [ ] Tampilkan status aktif dan urutan tampil

### Business safety

- [ ] Lindungi agar seed kriteria default tidak hilang tanpa sengaja
- [ ] Putuskan aturan jika kriteria nonaktif tapi punya histori score

### Verifikasi

- [ ] Admin dapat mengelola kriteria
- [ ] Form assessment hanya memakai kriteria aktif

## Fase 6 — Manajemen User

### Backend

- [ ] Buat endpoint `GET /api/users`
- [ ] Buat endpoint `POST /api/users`
- [ ] Buat endpoint `PATCH /api/users/[id]` jika diperlukan
- [ ] Validasi role:
  - `ADMIN`
  - `SUPERVISOR`
  - `PIMPINAN`
- [ ] Hash password saat create/reset
- [ ] Cegah duplikasi email
- [ ] Dukung status aktif/nonaktif user

### Frontend

- [ ] Buat halaman daftar user
- [ ] Buat form tambah user
- [ ] Buat form edit user
- [ ] Tampilkan role dan status aktif

### Verifikasi

- [ ] Admin dapat membuat akun Supervisor
- [ ] Admin dapat membuat akun Pimpinan
- [ ] User nonaktif tidak bisa login

## Fase 7 — Penilaian Harian

### Data and validation layer

- [ ] Buat schema validasi create assessment
- [ ] Buat schema validasi update assessment
- [ ] Validasi status `PRESENT` atau `ABSENT`
- [ ] Validasi score integer 1 sampai 10
- [ ] Validasi semua kriteria aktif terisi jika status `PRESENT`
- [ ] Validasi score tidak wajib jika status `ABSENT`

### Backend API

- [ ] Buat endpoint `GET /api/assessments`
- [ ] Tambahkan filter:
  - tanggal
  - rentang tanggal
  - petugas
  - unit
  - status hadir
- [ ] Buat endpoint `POST /api/assessments`
- [ ] Buat endpoint `GET /api/assessments/[id]`
- [ ] Buat endpoint `PATCH /api/assessments/[id]`
- [ ] Tangani error duplicate assessment per hari

### Scoring logic

- [ ] Buat `src/lib/scoring.ts`
- [ ] Implementasi `calculateAverageScore`
- [ ] Pastikan hasil `null` untuk `ABSENT`
- [ ] Tambahkan helper pembulatan jika diperlukan

### Frontend pages

- [ ] Buat halaman list assessment
- [ ] Buat halaman form assessment baru
- [ ] Buat halaman edit assessment
- [ ] Buat filter tanggal dan petugas
- [ ] Tampilkan skor per kriteria dan average score
- [ ] Tampilkan status hadir/tidak hadir

### UX optimization

- [ ] Buat alur input yang cepat untuk supervisor
- [ ] Pertimbangkan default tanggal hari ini
- [ ] Pertimbangkan prefill petugas dan kriteria aktif
- [ ] Tampilkan warning jika penilaian hari itu sudah ada

### Stretch task

- [ ] Evaluasi kebutuhan batch entry penilaian harian banyak petugas
- [ ] Jika perlu, desain halaman input tabel per tanggal

### Verifikasi

- [ ] Acceptance criteria penilaian harian lulus
- [ ] Audit log penilaian tercatat

## Fase 8 — Dashboard dan Visualisasi

### Dashboard backend

- [ ] Buat endpoint `GET /api/dashboard/summary`
- [ ] Tambahkan query params:
  - `from`
  - `to`
  - `unitId`
- [ ] Buat service agregasi dashboard
- [ ] Hitung rata-rata skor per petugas
- [ ] Hitung tren harian
- [ ] Hitung tren mingguan
- [ ] Hitung tren bulanan
- [ ] Hitung ranking petugas
- [ ] Hitung distribusi skor per kriteria
- [ ] Hitung perbandingan antar unit

### Dashboard frontend

- [ ] Buat halaman dashboard utama
- [ ] Buat filter periode
- [ ] Buat filter unit
- [ ] Buat summary cards
- [ ] Buat line chart tren
- [ ] Buat bar chart atau pie chart distribusi kriteria
- [ ] Buat tabel ranking petugas
- [ ] Buat chart perbandingan unit

### UX and state handling

- [ ] Tampilkan loading state yang jelas
- [ ] Tampilkan empty state jika data kosong
- [ ] Tampilkan pesan valid jika filter tidak menghasilkan data

### Performance

- [ ] Profiling query dashboard untuk data 1 bulan
- [ ] Tambahkan index tambahan jika perlu
- [ ] Pastikan target < 3 detik realistis di lingkungan lokal

### Verifikasi

- [ ] Data dashboard sesuai hasil agregasi database
- [ ] Semua komponen breakdown tampil benar

## Fase 9 — Reward dan Punishment

### Business logic

- [ ] Buat helper kalkulasi skor agregat bulanan per petugas
- [ ] Terapkan threshold:
  - reward jika `>= 8.0`
  - punishment jika `<= 4.0`
- [ ] Pastikan hanya assessment `PRESENT` yang ikut skor rata-rata
- [ ] Tentukan perilaku jika data bulan tersebut minim atau tidak lengkap

### Backend API

- [ ] Buat endpoint `GET /api/reward-punishment`
- [ ] Buat endpoint `POST /api/reward-punishment` untuk generate rekomendasi
- [ ] Cegah duplikasi rekomendasi untuk periode yang sama jika diperlukan
- [ ] Buat endpoint `PATCH /api/reward-punishment/[id]`
- [ ] Dukung aksi:
  - approve
  - reject
- [ ] Simpan:
  - `category`
  - `notes`
  - `decidedById`
  - `decidedAt`

### Frontend

- [ ] Buat halaman daftar rekomendasi
- [ ] Tampilkan status `RECOMMENDED`, `APPROVED`, `REJECTED`
- [ ] Buat form atau dialog approve/reject
- [ ] Tampilkan detail skor pemicu rekomendasi
- [ ] Tampilkan kategori tindakan

### Verifikasi

- [ ] Sistem menghasilkan rekomendasi sesuai threshold
- [ ] Approval flow berjalan
- [ ] Audit log keputusan tercatat

## Fase 10 — Reporting dan Export

### Reporting backend

- [ ] Buat endpoint `GET /api/reports/export`
- [ ] Dukung query:
  - `format=pdf`
  - `format=xlsx`
  - `from`
  - `to`
- [ ] Buat service query laporan
- [ ] Pastikan data laporan memuat:
  - nama petugas
  - unit
  - skor per kriteria
  - average score
  - ranking

### Excel export

- [ ] Implementasi export dengan `exceljs`
- [ ] Rapikan header, kolom, dan formatting dasar
- [ ] Pastikan nama file jelas

### PDF export

- [ ] Implementasi export dengan `@react-pdf/renderer`
- [ ] Buat layout laporan yang rapi dan mudah dibaca
- [ ] Pastikan cocok untuk kebutuhan formal internal

### Frontend

- [ ] Buat halaman laporan
- [ ] Buat filter periode
- [ ] Buat pemilih format export
- [ ] Tambahkan feedback saat file sedang digenerate

### Verifikasi

- [ ] File Excel bisa dibuka dengan benar
- [ ] File PDF dapat diunduh dan dibaca
- [ ] Waktu generate masih wajar untuk data 1 bulan

## Fase 11 — Hardening, QA, dan Deployment Readiness

### Functional QA

- [ ] Uji login/logout/session expiry
- [ ] Uji manajemen petugas
- [ ] Uji manajemen kriteria
- [ ] Uji manajemen user
- [ ] Uji assessment `PRESENT`
- [ ] Uji assessment `ABSENT`
- [ ] Uji duplicate assessment
- [ ] Uji dashboard dengan data ada
- [ ] Uji dashboard tanpa data
- [ ] Uji reward/punishment
- [ ] Uji export PDF
- [ ] Uji export Excel

### Security and robustness

- [ ] Pastikan semua endpoint sensitif butuh login
- [ ] Cegah user nonaktif mengakses sistem
- [ ] Validasi input server-side di semua API
- [ ] Pastikan error internal tidak membocorkan detail sensitif

### Data integrity

- [ ] Verifikasi audit log pada entitas penting
- [ ] Verifikasi relasi data tetap aman saat data nonaktif
- [ ] Verifikasi histori lama tidak rusak saat master data berubah

### UI polish

- [ ] Rapikan loading state
- [ ] Rapikan empty state
- [ ] Rapikan validasi form
- [ ] Rapikan copywriting Bahasa Indonesia

### Deployment readiness

- [ ] Finalisasi `.env.example`
- [ ] Dokumentasikan langkah setup PostgreSQL
- [ ] Dokumentasikan `prisma migrate deploy`
- [ ] Dokumentasikan seed production awal
- [ ] Dokumentasikan build dan start dengan PM2

## Cross-Cutting Tasks

### Validasi dan schema

- [ ] Simpan semua Zod schema di `src/lib/validations`
- [ ] Gunakan schema yang sama untuk client dan server bila memungkinkan

### Error handling

- [ ] Standarkan response sukses API
- [ ] Standarkan response error API
- [ ] Mapping error Prisma ke pesan user-friendly

### Naming dan consistency

- [ ] UI tetap Bahasa Indonesia
- [ ] Nama variabel, fungsi, dan model tetap Bahasa Inggris
- [ ] Folder route memakai kebab-case

### Logging dan observability

- [ ] Tambahkan logging server minimal untuk error penting
- [ ] Bedakan logging development dan production bila perlu

## Milestone yang Direkomendasikan

### Milestone 1

- [x] Login berjalan
- [ ] Database dan seed siap
- [ ] Audit foundation siap

### Milestone 2

- [ ] Master data petugas, unit, kriteria, user siap

### Milestone 3

- [ ] Penilaian harian siap dipakai

### Milestone 4

- [ ] Dashboard MVP siap dipakai

### Milestone 5

- [ ] Reward/punishment dan export siap

### Milestone 6

- [ ] Siap UAT dan deployment internal

## File Lanjutan Setelah Ini

Setelah task breakdown ini, file yang paling berguna untuk dibuat berikutnya:

- `database-decisions.md`
- `test-scenarios.md`
- `api-contract-notes.md`
