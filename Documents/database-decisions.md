# Database Decisions SIMON PST

## Tujuan Dokumen

Dokumen ini merangkum keputusan desain database untuk SIMON PST berdasarkan `prd.md`, lalu menambahkan keputusan implementasi yang perlu konsisten saat menulis `schema.prisma`, migration, seed, query API, dan dashboard aggregation.

## 1. Prinsip Dasar

- Database utama: PostgreSQL
- ORM: Prisma
- Source of truth struktur inti tetap mengacu ke schema pada `prd.md`
- Perubahan schema di luar PRD harus seminimal mungkin dan harus punya alasan jelas
- Histori penilaian dan keputusan reward/punishment tidak boleh hilang walaupun master data berubah atau dinonaktifkan

## 2. Model Inti yang Dipakai

Model utama yang akan dipakai:

- `User`
- `Unit`
- `Officer`
- `Criteria`
- `DailyAssessment`
- `AssessmentScore`
- `RewardPunishment`
- `AuditLog`

Semua nama model, field, dan enum tetap menggunakan Bahasa Inggris agar konsisten dengan PRD dan codebase TypeScript/Prisma.

## 3. Keputusan Per Model

### `User`

Tujuan:

- Menyimpan akun internal yang dapat login ke sistem

Field utama:

- `id`
- `name`
- `email`
- `passwordHash`
- `role`
- `isActive`
- `createdAt`
- `updatedAt`

Keputusan:

- `email` wajib unik
- `passwordHash` wajib menyimpan hasil hash bcrypt, bukan password plain text
- `role` tetap disimpan walaupun permission saat ini identik
- `isActive` dipakai untuk menonaktifkan akun tanpa menghapus histori audit dan aktivitas

Catatan implementasi:

- User nonaktif tidak boleh bisa login
- Delete fisik untuk user sebaiknya dihindari

### `Unit`

Tujuan:

- Menyimpan unit kerja petugas PST

Field utama:

- `id`
- `name`
- `description`

Keputusan:

- `Unit` tetap dipertahankan walaupun deployment hanya 1 kantor
- `description` bersifat opsional
- Unit tidak perlu `isActive` pada tahap awal kecuali muncul kebutuhan nyata

Catatan implementasi:

- Karena belum ada kebutuhan histori kompleks untuk unit, pendekatan awal cukup dengan edit data unit
- Jika nanti perlu soft delete, bisa ditambahkan di iterasi berikutnya

### `Officer`

Tujuan:

- Menyimpan master petugas PST yang akan dinilai

Field utama:

- `id`
- `nip`
- `name`
- `position`
- `unitId`
- `isActive`
- `createdAt`

Keputusan:

- `nip` wajib unik
- `unitId` boleh null untuk menghindari blocking saat input awal
- `position` boleh null
- `isActive` wajib dipakai untuk nonaktifkan petugas tanpa menghapus histori penilaian

Catatan implementasi:

- Delete fisik officer sebaiknya tidak dipakai di UI
- Officer nonaktif tetap harus tampil pada histori assessment dan laporan periode lama

### `Criteria`

Tujuan:

- Menyimpan kriteria penilaian yang aktif digunakan sistem

Field utama:

- `id`
- `name`
- `description`
- `sortOrder`
- `isActive`

Keputusan:

- Seed awal hanya 2 kriteria:
  - `Disiplin`
  - `Kinerja`
- `sortOrder` dipakai untuk urutan tampil di form dan laporan
- `isActive` dipakai agar kriteria lama bisa dihentikan tanpa merusak histori score

Catatan implementasi:

- Kriteria yang sudah pernah dipakai di `AssessmentScore` tidak boleh dihapus fisik lewat UI
- Nonaktif lebih aman daripada delete

### `DailyAssessment`

Tujuan:

- Menyimpan 1 record penilaian per petugas per hari

Field utama:

- `id`
- `officerId`
- `assessorId`
- `assessmentDate`
- `status`
- `averageScore`
- `notes`
- `createdAt`
- `updatedAt`

Keputusan:

- Unique constraint `officerId + assessmentDate` wajib
- `assessmentDate` menggunakan tipe date di database
- `status` hanya `PRESENT` atau `ABSENT`
- `averageScore` bernilai `null` jika `status = ABSENT`
- `notes` opsional

Catatan implementasi:

- Secara bisnis, `ABSENT` tetap harus dibuat agar compliance harian bisa dihitung
- Histori assessor tetap dipertahankan walau assessor kemudian nonaktif

### `AssessmentScore`

Tujuan:

- Menyimpan skor per kriteria untuk satu `DailyAssessment`

Field utama:

- `id`
- `dailyAssessmentId`
- `criteriaId`
- `score`

Keputusan:

- Unique constraint `dailyAssessmentId + criteriaId` wajib
- `score` hanya untuk assessment `PRESENT`
- Untuk assessment `ABSENT`, tidak dibuat row `AssessmentScore`

Catatan implementasi:

- Validasi rentang `1-10` dilakukan di application layer
- Jika ingin menambah guard lebih kuat, bisa dipertimbangkan DB check constraint di iterasi lanjut, tapi tidak wajib untuk MVP

### `RewardPunishment`

Tujuan:

- Menyimpan rekomendasi dan keputusan reward/punishment

Field utama:

- `id`
- `officerId`
- `type`
- `category`
- `periodStart`
- `periodEnd`
- `triggerScore`
- `status`
- `decidedById`
- `decidedAt`
- `notes`
- `createdAt`

Keputusan:

- Threshold final:
  - reward jika `triggerScore >= 8.0`
  - punishment jika `triggerScore <= 4.0`
- `category` wajib fleksibel dalam bentuk string
- `notes` opsional tapi disarankan diisi terutama saat approval/reject
- `decidedById` dan `decidedAt` boleh null saat status masih `RECOMMENDED`

Catatan implementasi:

- Perlu mekanisme cegah duplikasi rekomendasi untuk officer dan periode yang sama
- Duplikasi bisa dicegah di application layer lebih dulu, lalu jika perlu diperkuat dengan unique index komposit setelah aturan final stabil

### `AuditLog`

Tujuan:

- Menyimpan jejak perubahan data penting

Field utama:

- `id`
- `userId`
- `action`
- `entity`
- `entityId`
- `beforeData`
- `afterData`
- `createdAt`

Keputusan:

- Audit wajib minimal untuk:
  - `DailyAssessment`
  - `RewardPunishment`
- Audit untuk `Officer`, `Criteria`, dan `User` sangat disarankan
- `beforeData` dan `afterData` menggunakan `Json?`

Catatan implementasi:

- Audit harus ditulis dari layer terpusat, bukan manual di setiap endpoint
- Operasi gagal tidak boleh menghasilkan audit log palsu

## 4. Relasi dan Aturan Delete

### Aturan umum

- Histori operasional lebih penting daripada delete fisik
- Soft deactivation diprioritaskan untuk master data

### Keputusan relasi

- `Officer -> DailyAssessment`
  - Jangan hapus officer yang sudah punya histori assessment
- `Officer -> RewardPunishment`
  - Jangan hapus officer yang sudah punya histori reward/punishment
- `Criteria -> AssessmentScore`
  - Jangan hapus kriteria yang sudah pernah dipakai
- `DailyAssessment -> AssessmentScore`
  - Gunakan `onDelete: Cascade` agar saat assessment dihapus sah, score turunannya ikut terhapus
- `User -> AuditLog`
  - Hindari delete user
- `User -> DailyAssessment` dan `User -> RewardPunishment`
  - Hindari delete user agar histori assessor dan approver tetap utuh

### Rekomendasi kebijakan aplikasi

- `User`, `Officer`, dan `Criteria` tidak menyediakan delete fisik di UI MVP
- Gunakan edit atau nonaktifkan
- `DailyAssessment` delete boleh dibuka hanya jika benar-benar diperlukan oleh workflow admin, dengan audit wajib

## 5. Indexing Decisions

Index yang sudah jelas berguna sejak awal:

- `User.email`
  - sudah unik, otomatis terindeks
- `Officer.nip`
  - sudah unik, otomatis terindeks
- `DailyAssessment(officerId, assessmentDate)`
  - unique, otomatis terindeks
- `AssessmentScore(dailyAssessmentId, criteriaId)`
  - unique, otomatis terindeks
- `AuditLog(entity, entityId)`
  - sesuai PRD

Index tambahan yang direkomendasikan sejak migration awal:

- index `DailyAssessment.assessmentDate`
- index `DailyAssessment.assessorId`
- index `Officer.unitId`
- index `RewardPunishment.officerId`
- index `RewardPunishment.status`
- index `RewardPunishment.periodStart`
- index `RewardPunishment.periodEnd`

Alasan:

- Dashboard banyak filter berdasarkan periode
- List assessment kemungkinan sering filter per tanggal, petugas, dan unit
- Reward/punishment akan sering ditampilkan per periode dan status

## 6. Tipe Data dan Presisi

### Tanggal

- `assessmentDate`, `periodStart`, dan `periodEnd` memakai `@db.Date`
- Field timestamp audit dan lifecycle record tetap `DateTime`

### Nilai skor

- `AssessmentScore.score` memakai `Int`
- `DailyAssessment.averageScore` memakai `Float?`
- `RewardPunishment.triggerScore` memakai `Float`

Keputusan pembulatan:

- Skor input tetap integer
- `averageScore` dihitung di aplikasi
- Untuk tampilan UI dan laporan, gunakan pembulatan konsisten, misalnya 2 digit desimal
- Nilai mentah tetap boleh disimpan sebagai float agar agregasi lebih presisi

## 7. Validasi yang Wajib di Application Layer

Validasi berikut tidak cukup hanya mengandalkan schema database:

- score harus berada pada rentang `1` sampai `10`
- assessment `PRESENT` wajib punya score untuk semua criteria aktif
- assessment `ABSENT` tidak boleh punya score
- `averageScore` untuk `ABSENT` harus `null`
- user nonaktif tidak bisa login
- duplikasi rekomendasi reward/punishment per officer-periode harus dicegah

Zod schema sebaiknya menjadi lapisan utama untuk validasi request.

## 8. Seed Strategy

### Seed minimum untuk development awal

- 1 `Unit` default
- 2 `Criteria` default:
  - `Disiplin`
  - `Kinerja`
- 1 `Admin` default

### Prinsip seed

- Seed harus idempotent sebisa mungkin
- Gunakan upsert jika cocok
- Jangan menggandakan kriteria default saat seed dijalankan ulang
- Password admin seed harus dibaca dari env jika memungkinkan, dengan fallback yang hanya aman untuk local development

### Saran env seed

- `SEED_ADMIN_NAME`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `SEED_DEFAULT_UNIT_NAME`

## 9. Query and Aggregation Decisions

### Daily assessment list

Filter yang perlu didukung:

- tanggal tunggal
- rentang tanggal
- officer
- unit
- attendance status

### Dashboard aggregation

Agregasi utama yang harus bisa dihitung:

- rata-rata skor per petugas
- tren harian
- tren mingguan
- tren bulanan
- ranking petugas
- distribusi skor per kriteria
- perbandingan antar unit

Keputusan:

- Assessment `ABSENT` tidak dihitung ke rata-rata skor
- Assessment `ABSENT` tetap bisa dihitung untuk statistik kehadiran atau compliance jika nanti dibutuhkan

### Reward/punishment aggregation

Keputusan:

- Perhitungan bulanan hanya memakai assessment `PRESENT`
- Jika officer tidak punya data `PRESENT` pada periode, maka tidak otomatis dapat rekomendasi

## 10. Candidate Schema Enhancements yang Tidak Wajib Sekarang

Item berikut sengaja belum dimasukkan ke PRD schema agar implementasi tetap ramping:

- `deletedAt` untuk soft delete formal
- `updatedBy` pada master data
- tabel konfigurasi threshold reward/punishment
- tabel kategori reward/punishment terpisah
- tabel kalender hari kerja

Alasan:

- Saat ini kebutuhan masih bisa ditangani oleh schema PRD
- Menambah model terlalu awal berisiko memperlambat implementasi MVP

## 11. Keputusan yang Perlu Konsisten di Kode

- Hindari delete fisik untuk master data
- Simpan histori sebanyak mungkin
- Gunakan `isActive` untuk user, officer, dan criteria
- Jangan mengubah nama model dan field inti dari PRD tanpa alasan kuat
- Pastikan seluruh perhitungan rata-rata mengabaikan record `ABSENT`
- Pastikan seluruh tampilan histori tetap bisa membaca data lama meskipun master data sudah nonaktif

## 12. Checklist Saat Menulis `schema.prisma`

- [ ] Semua enum sesuai PRD
- [ ] Semua relasi sesuai PRD
- [ ] Unique constraint utama terpasang
- [ ] Index tambahan yang direkomendasikan ditambahkan
- [ ] `@db.Date` dipakai pada field tanggal yang memang tanggal
- [ ] `onDelete: Cascade` hanya dipakai pada `DailyAssessment -> AssessmentScore`
- [ ] Tidak ada delete behavior yang berisiko menghapus histori penting
- [ ] Schema tetap kompatibel dengan kebutuhan dashboard dan laporan
