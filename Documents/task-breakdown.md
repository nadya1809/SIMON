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

- [x] Buat file util dasar `src/lib/utils.ts` jika diperlukan
- [x] Siapkan alias import bila diperlukan
- [x] Tambahkan README setup lokal singkat

## Fase 1 — Database, Prisma, dan Auth Foundation `[x]`

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
- [x] Jalankan migration awal
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

- [x] Buat `src/lib/audit.ts`
- [x] Tentukan pendekatan audit terpusat:
  - Prisma middleware
  - atau wrapper service yang konsisten
- [x] Pastikan audit minimal mencatat:
  - user
  - action
  - entity
  - entityId
  - beforeData
  - afterData
  - createdAt

### Audit integration

- [x] Pasang audit untuk create/update/delete `DailyAssessment`
- [x] Pasang audit untuk create/update/delete `RewardPunishment`
- [x] Pertimbangkan juga audit untuk `Officer`, `Criteria`, dan `User`
- [x] Pastikan operasi gagal tidak membuat audit palsu

### Audit verification

- [x] Uji create menghasilkan audit log
- [x] Uji update menghasilkan before/after data
- [x] Uji delete menghasilkan jejak perubahan yang cukup

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

## Fase 3 — Master Data Unit `[x]`

### Backend

- [x] Buat endpoint `GET /api/units`
- [x] Buat endpoint `POST /api/units`
- [x] Buat endpoint `PATCH /api/units/[id]`
- [x] Tentukan apakah `DELETE` dihindari dan diganti nonaktif/edit saja
- [x] Tambahkan validasi Zod untuk unit

### Frontend

- [x] Buat halaman daftar unit
- [x] Buat form tambah/edit unit
- [x] Tampilkan relasi jumlah petugas per unit jika memungkinkan

### Verifikasi

- [x] Admin dapat menambah unit
- [x] Admin dapat mengubah data unit

## Fase 4 — Master Data Petugas `[x]`

### Backend

- [x] Buat schema validasi petugas
- [x] Buat endpoint `GET /api/officers`
- [x] Tambahkan filter:
  - pencarian nama
  - pencarian NIP
  - filter unit
  - filter status aktif
- [x] Buat endpoint `POST /api/officers`
- [x] Buat endpoint `GET /api/officers/[id]`
- [x] Buat endpoint `PATCH /api/officers/[id]`
- [x] Buat endpoint nonaktifkan petugas
- [x] Pastikan `nip` unik

### Frontend

- [x] Buat halaman daftar petugas
- [x] Buat table petugas dengan pencarian dan filter
- [x] Buat form tambah petugas
- [x] Buat form edit petugas
- [x] Tampilkan badge aktif/nonaktif
- [x] Buat detail singkat petugas jika diperlukan

### UX untuk skala 40+ petugas

- [x] Tambahkan pagination atau limit rows
- [x] Buat sorting nama/NIP/unit
- [x] Pastikan daftar tetap ringan dan mudah dipakai

### Verifikasi

- [x] Admin dapat CRUD petugas
- [x] Data petugas siap dipakai di penilaian

## Fase 5 — Master Data Kriteria `[x]`

### Backend

- [x] Buat endpoint `GET /api/criteria`
- [x] Buat endpoint `POST /api/criteria`
- [x] Buat endpoint `PATCH /api/criteria/[id]`
- [x] Pastikan `sortOrder` didukung
- [x] Pastikan kriteria bisa dinonaktifkan

### Frontend

- [x] Buat halaman daftar kriteria
- [x] Buat form tambah/edit kriteria
- [x] Tampilkan status aktif dan urutan tampil

### Business safety

- [x] Lindungi agar seed kriteria default tidak hilang tanpa sengaja
- [x] Putuskan aturan jika kriteria nonaktif tapi punya histori score

### Verifikasi

- [x] Admin dapat mengelola kriteria
- [x] Form assessment hanya memakai kriteria aktif

## Fase 6 — Manajemen User `[x]`

### Backend

- [x] Buat endpoint `GET /api/users`
- [x] Buat endpoint `POST /api/users`
- [x] Buat endpoint `PATCH /api/users/[id]` jika diperlukan
- [x] Validasi role:
  - `ADMIN`
  - `SUPERVISOR`
  - `PIMPINAN`
- [x] Hash password saat create/reset
- [x] Cegah duplikasi email
- [x] Dukung status aktif/nonaktif user

### Frontend

- [x] Buat halaman daftar user
- [x] Buat form tambah user
- [x] Buat form edit user
- [x] Tampilkan role dan status aktif

### Verifikasi

- [x] Admin dapat membuat akun Supervisor
- [x] Admin dapat membuat akun Pimpinan
- [x] User nonaktif tidak bisa login

## Fase 7 — Penilaian Harian `[x]`

### Data and validation layer

- [x] Buat schema validasi create assessment
- [x] Buat schema validasi update assessment
- [x] Validasi status `PRESENT` atau `ABSENT`
- [x] Validasi score integer 1 sampai 10
- [x] Validasi semua kriteria aktif terisi jika status `PRESENT`
- [x] Validasi score tidak wajib jika status `ABSENT`

### Backend API

- [x] Buat endpoint `GET /api/assessments`
- [x] Tambahkan filter:
  - tanggal
  - rentang tanggal
  - petugas
  - unit
  - status hadir
- [x] Buat endpoint `POST /api/assessments`
- [x] Buat endpoint `GET /api/assessments/[id]`
- [x] Buat endpoint `PATCH /api/assessments/[id]`
- [x] Tangani error duplicate assessment per hari

### Scoring logic

- [x] Buat `src/lib/scoring.ts`
- [x] Implementasi `calculateAverageScore`
- [x] Pastikan hasil `null` untuk `ABSENT`
- [x] Tambahkan helper pembulatan jika diperlukan

### Frontend pages

- [x] Buat halaman list assessment
- [x] Buat halaman form assessment baru
- [x] Buat halaman edit assessment
- [x] Buat filter tanggal dan petugas
- [x] Tampilkan skor per kriteria dan average score
- [x] Tampilkan status hadir/tidak hadir

### UX optimization

- [x] Buat alur input yang cepat untuk supervisor
- [x] Pertimbangkan default tanggal hari ini
- [x] Pertimbangkan prefill petugas dan kriteria aktif
- [x] Tampilkan warning jika penilaian hari itu sudah ada

### Stretch task

- [x] Evaluasi kebutuhan batch entry penilaian harian banyak petugas
- [x] Jika perlu, desain halaman input tabel per tanggal

### Verifikasi

- [x] Acceptance criteria penilaian harian lulus
- [x] Audit log penilaian tercatat

## Fase 8 — Dashboard dan Visualisasi `[x]`

### Dashboard backend

- [x] Buat endpoint `GET /api/dashboard/summary`
- [x] Tambahkan query params:
  - `from`
  - `to`
  - `unitId`
- [x] Buat service agregasi dashboard
- [x] Hitung rata-rata skor per petugas
- [x] Hitung tren harian
- [x] Hitung tren mingguan
- [x] Hitung tren bulanan
- [x] Hitung ranking petugas
- [x] Hitung distribusi skor per kriteria
- [x] Hitung perbandingan antar unit

### Dashboard frontend

- [x] Buat halaman dashboard utama
- [x] Buat filter periode
- [x] Buat filter unit
- [x] Buat summary cards
- [x] Buat line chart tren
- [x] Buat bar chart atau pie chart distribusi kriteria
- [x] Buat tabel ranking petugas
- [x] Buat chart perbandingan unit

### UX and state handling

- [x] Tampilkan loading state yang jelas
- [x] Tampilkan empty state jika data kosong
- [x] Tampilkan pesan valid jika filter tidak menghasilkan data

### Performance

- [x] Profiling query dashboard untuk data 1 bulan
- [x] Tambahkan index tambahan jika perlu
- [x] Pastikan target < 3 detik realistis di lingkungan lokal

### Verifikasi

- [x] Data dashboard sesuai hasil agregasi database
- [x] Semua komponen breakdown tampil benar

## Fase 9 — Reward dan Punishment `[x]`

### Business logic

- [x] Buat helper kalkulasi skor agregat bulanan per petugas
- [x] Terapkan threshold:
  - reward jika `>= 8.0`
  - punishment jika `<= 4.0`
- [x] Pastikan hanya assessment `PRESENT` yang ikut skor rata-rata
- [x] Tentukan perilaku jika data bulan tersebut minim atau tidak lengkap

### Backend API

- [x] Buat endpoint `GET /api/reward-punishment`
- [x] Buat endpoint `POST /api/reward-punishment` untuk generate rekomendasi
- [x] Cegah duplikasi rekomendasi untuk periode yang sama jika diperlukan
- [x] Buat endpoint `PATCH /api/reward-punishment/[id]`
- [x] Dukung aksi:
  - approve
  - reject
- [x] Simpan:
  - `category`
  - `notes`
  - `decidedById`
  - `decidedAt`

### Frontend

- [x] Buat halaman daftar rekomendasi
- [x] Tampilkan status `RECOMMENDED`, `APPROVED`, `REJECTED`
- [x] Buat form atau dialog approve/reject
- [x] Tampilkan detail skor pemicu rekomendasi
- [x] Tampilkan kategori tindakan

### Verifikasi

- [x] Sistem menghasilkan rekomendasi sesuai threshold
- [x] Approval flow berjalan
- [x] Audit log keputusan tercatat

## Fase 10 — Reporting dan Export `[x]`

### Reporting backend

- [x] Buat endpoint `GET /api/reports/export`
- [x] Dukung query:
  - `format=pdf`
  - `format=xlsx`
  - `from`
  - `to`
- [x] Buat service query laporan
- [x] Pastikan data laporan memuat:
  - nama petugas
  - unit
  - skor per kriteria
  - average score
  - ranking

### Excel export

- [x] Implementasi export dengan `exceljs`
- [x] Rapikan header, kolom, dan formatting dasar
- [x] Pastikan nama file jelas

### PDF export

- [x] Implementasi export dengan `@react-pdf/renderer`
- [x] Buat layout laporan yang rapi dan mudah dibaca
- [x] Pastikan cocok untuk kebutuhan formal internal

### Frontend

- [x] Buat halaman laporan
- [x] Buat filter periode
- [x] Buat pemilih format export
- [x] Tambahkan feedback saat file sedang digenerate

### Verifikasi

- [x] File Excel bisa dibuka dengan benar
- [x] File PDF dapat diunduh dan dibaca
- [x] Waktu generate masih wajar untuk data 1 bulan

## Fase 11 — Hardening, QA, dan Deployment Readiness

### Functional QA

- [x] Uji login/logout/session expiry
- [x] Uji manajemen petugas
- [x] Uji manajemen kriteria
- [x] Uji manajemen user
- [x] Uji assessment `PRESENT`
- [x] Uji assessment `ABSENT`
- [x] Uji duplicate assessment
- [x] Uji dashboard dengan data ada
- [x] Uji dashboard tanpa data
- [x] Uji reward/punishment
- [x] Uji export PDF
- [x] Uji export Excel

### Security and robustness

- [x] Pastikan semua endpoint sensitif butuh login
- [x] Cegah user nonaktif mengakses sistem
- [x] Validasi input server-side di semua API
- [x] Pastikan error internal tidak membocorkan detail sensitif

### Data integrity

- [x] Verifikasi audit log pada entitas penting
- [x] Verifikasi relasi data tetap aman saat data nonaktif
- [x] Verifikasi histori lama tidak rusak saat master data berubah

### UI polish

- [x] Rapikan loading state
- [x] Rapikan empty state
- [x] Rapikan validasi form
- [x] Rapikan copywriting Bahasa Indonesia

### Deployment readiness

- [x] Finalisasi `.env.example`
- [x] Dokumentasikan langkah setup PostgreSQL
- [x] Dokumentasikan `prisma migrate deploy`
- [x] Dokumentasikan seed production awal
- [x] Dokumentasikan build dan start dengan PM2

## Cross-Cutting Tasks

### Validasi dan schema

- [x] Simpan semua Zod schema di `src/lib/validations`
- [x] Gunakan schema yang sama untuk client dan server bila memungkinkan

### Error handling

- [x] Standarkan response sukses API
- [x] Standarkan response error API
- [x] Mapping error Prisma ke pesan user-friendly

### Naming dan consistency

- [x] UI tetap Bahasa Indonesia
- [x] Nama variabel, fungsi, dan model tetap Bahasa Inggris
- [x] Folder route memakai kebab-case

### Logging dan observability

- [x] Tambahkan logging server minimal untuk error penting
- [x] Bedakan logging development dan production bila perlu

## Milestone yang Direkomendasikan

### Milestone 1

- [x] Login berjalan
- [x] Database dan seed siap
- [x] Audit foundation siap

### Milestone 2

- [x] Master data petugas, unit, kriteria, user siap

### Milestone 3

- [x] Penilaian harian siap dipakai

### Milestone 4

- [x] Dashboard MVP siap dipakai

### Milestone 5

- [x] Reward/punishment dan export siap

### Milestone 6

- [x] Siap UAT dan deployment internal

## File Lanjutan Setelah Ini

Setelah task breakdown ini, file yang paling berguna untuk dibuat berikutnya:

- `database-decisions.md`
- `test-scenarios.md`
- `api-contract-notes.md`
