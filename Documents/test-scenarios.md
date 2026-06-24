# Test Scenarios SIMON PST

## Tujuan Dokumen

Dokumen ini menurunkan acceptance criteria dari `prd.md` menjadi skenario uji yang lebih konkret. Fokus utama dokumen ini adalah:

- memastikan fitur prioritas P1 dan P2 sesuai requirement
- menangkap edge case yang paling berisiko
- menjadi acuan QA manual dan dasar automated testing di tahap implementasi

## Ruang Lingkup

Skenario uji mencakup:

- autentikasi
- master data
- penilaian harian
- dashboard
- reward/punishment
- export laporan
- audit log

## Format Status

- `[ ]` belum diuji
- `[x]` lulus
- `[!]` gagal atau perlu investigasi

## 1. Auth dan Session

### AUTH-01 Login berhasil dengan akun aktif

Tujuan:

- Memastikan user aktif dapat login menggunakan email dan password yang benar

Precondition:

- Terdapat user aktif di database

Langkah:

1. Buka halaman login
2. Isi email valid
3. Isi password valid
4. Submit form

Expected result:

- User berhasil login
- User diarahkan ke dashboard
- Session berisi `id`, `name`, `email`, dan `role`

### AUTH-02 Login gagal dengan password salah

Langkah:

1. Buka halaman login
2. Isi email valid
3. Isi password salah
4. Submit form

Expected result:

- Login ditolak
- Muncul pesan error yang jelas
- Session tidak dibuat

### AUTH-03 Login gagal untuk user nonaktif

Precondition:

- Terdapat user dengan `isActive = false`

Langkah:

1. Login menggunakan user nonaktif

Expected result:

- Login ditolak
- Muncul pesan bahwa akun tidak aktif atau tidak dapat digunakan

### AUTH-04 Akses halaman dashboard tanpa login

Langkah:

1. Buka route dashboard tanpa session

Expected result:

- User diarahkan ke halaman login

### AUTH-05 Akses API terlindungi tanpa login

Langkah:

1. Panggil endpoint API terlindungi tanpa session

Expected result:

- Request ditolak
- Response status sesuai desain auth, misalnya `401`

## 2. Master Data Unit

### UNIT-01 Admin menambah unit baru

Langkah:

1. Login sebagai admin
2. Buka halaman unit
3. Tambah unit baru
4. Simpan

Expected result:

- Unit tersimpan
- Unit muncul di daftar

### UNIT-02 Admin mengubah unit

Langkah:

1. Pilih unit yang sudah ada
2. Ubah nama atau deskripsi
3. Simpan

Expected result:

- Data unit terupdate

## 3. Master Data Petugas

### OFF-01 Admin menambah petugas valid

Langkah:

1. Login sebagai admin
2. Buka halaman petugas
3. Isi NIP unik, nama, posisi, dan unit
4. Simpan

Expected result:

- Petugas berhasil dibuat
- Data muncul di daftar

### OFF-02 Admin gagal menambah petugas dengan NIP duplikat

Precondition:

- Sudah ada petugas dengan NIP tertentu

Langkah:

1. Tambah petugas baru dengan NIP yang sama

Expected result:

- Penyimpanan ditolak
- Muncul pesan error bahwa NIP sudah digunakan

### OFF-03 Admin menonaktifkan petugas

Langkah:

1. Buka detail atau aksi petugas
2. Ubah status menjadi nonaktif

Expected result:

- Petugas berubah menjadi nonaktif
- Histori penilaian lama tetap ada

### OFF-04 Daftar petugas bisa difilter

Langkah:

1. Gunakan pencarian nama
2. Gunakan filter unit
3. Gunakan filter status aktif

Expected result:

- Daftar menampilkan hasil sesuai filter

## 4. Master Data Kriteria

### CRT-01 Seed awal membuat dua kriteria default

Expected result:

- Tersedia `Disiplin`
- Tersedia `Kinerja`

### CRT-02 Admin menambah kriteria baru

Langkah:

1. Login sebagai admin
2. Tambah kriteria baru

Expected result:

- Kriteria tersimpan
- Urutan tampil mengikuti `sortOrder`

### CRT-03 Admin menonaktifkan kriteria

Langkah:

1. Nonaktifkan kriteria yang ada

Expected result:

- Kriteria tidak muncul pada form assessment baru
- Histori skor lama yang memakai kriteria itu tetap aman

## 5. Manajemen User

### USR-01 Admin membuat akun supervisor

Langkah:

1. Login sebagai admin
2. Buka halaman user
3. Tambah user dengan role `SUPERVISOR`
4. Simpan

Expected result:

- Akun berhasil dibuat
- Password tersimpan dalam bentuk hash

### USR-02 Admin membuat akun pimpinan

Langkah:

1. Tambah user dengan role `PIMPINAN`

Expected result:

- Akun berhasil dibuat

### USR-03 Gagal membuat user dengan email duplikat

Precondition:

- Sudah ada user dengan email tertentu

Langkah:

1. Tambah user baru dengan email yang sama

Expected result:

- Penyimpanan ditolak
- Muncul pesan error yang jelas

## 6. Penilaian Harian

### ASM-01 Buat assessment hadir dengan skor lengkap

Tujuan:

- Memastikan acceptance criteria utama penilaian harian terpenuhi

Precondition:

- User login
- Tersedia petugas aktif
- Tersedia kriteria aktif

Langkah:

1. Buka form assessment baru
2. Pilih petugas
3. Pilih tanggal hari ini
4. Pilih status `PRESENT`
5. Isi skor `Disiplin`
6. Isi skor `Kinerja`
7. Submit

Expected result:

- Record `DailyAssessment` tersimpan
- Record `AssessmentScore` tersimpan untuk semua kriteria aktif
- `averageScore` dihitung otomatis

### ASM-02 Gagal membuat assessment duplikat untuk petugas dan tanggal yang sama

Precondition:

- Sudah ada assessment untuk petugas A di tanggal X

Langkah:

1. Buat assessment lagi untuk petugas A di tanggal X

Expected result:

- Penyimpanan ditolak
- Muncul validation error

### ASM-03 Gagal submit skor di luar rentang 1 sampai 10

Langkah:

1. Isi salah satu skor dengan `0`, `11`, atau nilai nonvalid lain
2. Submit

Expected result:

- Form menampilkan error
- Data tidak tersimpan

### ASM-04 Buat assessment tidak hadir

Langkah:

1. Buka form assessment baru
2. Pilih petugas
3. Pilih tanggal
4. Pilih status `ABSENT`
5. Kosongkan skor
6. Submit

Expected result:

- Record `DailyAssessment` tersimpan
- `averageScore = null`
- Tidak ada row `AssessmentScore`

### ASM-05 Gagal submit `ABSENT` tetapi tetap mengirim score

Langkah:

1. Pilih status `ABSENT`
2. Tetap isi atau kirim score
3. Submit

Expected result:

- Request ditolak atau score diabaikan secara konsisten sesuai desain
- Tidak ada data score tidak valid yang tersimpan

### ASM-06 Gagal submit `PRESENT` tanpa semua score kriteria aktif

Langkah:

1. Pilih status `PRESENT`
2. Isi hanya sebagian skor
3. Submit

Expected result:

- Validasi gagal
- Data tidak tersimpan

### ASM-07 Edit assessment hadir

Langkah:

1. Buka assessment yang sudah ada
2. Ubah salah satu skor
3. Simpan

Expected result:

- Skor terupdate
- `averageScore` dihitung ulang

### ASM-08 Filter daftar assessment

Langkah:

1. Gunakan filter tanggal
2. Gunakan filter rentang tanggal
3. Gunakan filter petugas
4. Gunakan filter unit
5. Gunakan filter status hadir

Expected result:

- Daftar assessment sesuai filter

## 7. Dashboard dan Visualisasi

### DSH-01 Dashboard menampilkan data saat filter valid

Precondition:

- Sudah ada data assessment dalam rentang yang dipilih

Langkah:

1. Buka dashboard
2. Pilih rentang tanggal
3. Pilih unit jika perlu

Expected result:

- Tampil rata-rata skor per petugas
- Tampil tren harian, mingguan, atau bulanan
- Tampil ranking petugas

### DSH-02 Dashboard menampilkan empty state jika data kosong

Langkah:

1. Pilih rentang tanggal tanpa data

Expected result:

- Tidak muncul error
- Tampil empty state yang jelas

### DSH-03 Dashboard menampilkan distribusi skor per kriteria

Expected result:

- Tersedia breakdown per kriteria aktif
- Angka distribusi sesuai data sumber

### DSH-04 Dashboard menampilkan perbandingan antar unit

Precondition:

- Terdapat lebih dari satu unit dengan data assessment

Expected result:

- Tampil chart atau tabel perbandingan unit

### DSH-05 Data `ABSENT` tidak memengaruhi rata-rata skor dashboard

Precondition:

- Ada campuran data `PRESENT` dan `ABSENT`

Expected result:

- Rata-rata skor hanya dihitung dari `PRESENT`

## 8. Reward dan Punishment

### RWP-01 Generate rekomendasi reward otomatis

Precondition:

- Petugas memiliki rata-rata bulanan `>= 8.0`

Langkah:

1. Jalankan proses generate rekomendasi untuk periode tertentu

Expected result:

- Sistem membuat `RewardPunishment` bertipe `REWARD`
- Status awal `RECOMMENDED`
- `triggerScore` tersimpan

### RWP-02 Generate rekomendasi punishment otomatis

Precondition:

- Petugas memiliki rata-rata bulanan `<= 4.0`

Langkah:

1. Jalankan generate rekomendasi

Expected result:

- Sistem membuat `RewardPunishment` bertipe `PUNISHMENT`
- Status awal `RECOMMENDED`

### RWP-03 Tidak membuat rekomendasi jika skor berada di tengah

Precondition:

- Rata-rata bulanan petugas berada di antara `4.01` sampai `7.99`

Expected result:

- Tidak ada rekomendasi dibuat

### RWP-04 Approve rekomendasi

Langkah:

1. Buka record `RECOMMENDED`
2. Isi kategori jika diperlukan
3. Tekan approve

Expected result:

- Status berubah menjadi `APPROVED`
- `decidedById` terisi
- `decidedAt` terisi

### RWP-05 Reject rekomendasi

Langkah:

1. Buka record `RECOMMENDED`
2. Isi catatan jika diperlukan
3. Tekan reject

Expected result:

- Status berubah menjadi `REJECTED`
- `decidedById` terisi
- `decidedAt` terisi

### RWP-06 Tidak ada duplikasi rekomendasi untuk petugas dan periode yang sama

Langkah:

1. Jalankan generate rekomendasi dua kali untuk periode yang sama

Expected result:

- Sistem tidak membuat duplikasi record

### RWP-07 Data `ABSENT` tidak dihitung dalam trigger score

Expected result:

- `triggerScore` hanya berdasarkan assessment `PRESENT`

## 9. Reporting dan Export

### RPT-01 Export Excel berhasil

Langkah:

1. Buka halaman laporan
2. Pilih rentang tanggal
3. Pilih format Excel
4. Export

Expected result:

- File `.xlsx` berhasil diunduh
- File bisa dibuka
- Data di dalamnya sesuai periode

### RPT-02 Export PDF berhasil

Langkah:

1. Pilih format PDF
2. Export

Expected result:

- File `.pdf` berhasil diunduh
- File bisa dibuka dan dibaca

### RPT-03 Isi laporan sesuai requirement

Expected result:

- Laporan memuat:
  - nama petugas
  - skor per kriteria
  - average score
  - ranking

### RPT-04 Export tetap stabil untuk data 1 bulan

Expected result:

- Waktu generate masih dalam batas wajar
- Target PRD adalah kurang dari 30 detik

## 10. Audit Log

### AUD-01 Create assessment membuat audit log

Langkah:

1. Buat assessment baru

Expected result:

- Tercipta `AuditLog`
- `action = CREATE`
- `entity = DailyAssessment`

### AUD-02 Update assessment membuat audit log with before and after

Langkah:

1. Edit assessment yang ada

Expected result:

- Tercipta `AuditLog`
- `beforeData` dan `afterData` terisi

### AUD-03 Create reward/punishment membuat audit log

Expected result:

- Aktivitas generate atau create decision tercatat sesuai desain audit

### AUD-04 Update reward/punishment membuat audit log

Expected result:

- Approve atau reject tercatat

### AUD-05 Operasi gagal tidak membuat audit palsu

Langkah:

1. Kirim request invalid yang gagal divalidasi atau gagal disimpan

Expected result:

- Tidak ada audit log palsu untuk perubahan yang tidak terjadi

## 11. Data Integrity dan Histori

### INT-01 Petugas nonaktif tetap muncul di histori lama

Precondition:

- Petugas sudah punya assessment lalu dinonaktifkan

Expected result:

- Histori assessment lama tetap bisa dibuka

### INT-02 Kriteria nonaktif tidak merusak histori score lama

Expected result:

- Data lama tetap terbaca dengan benar

### INT-03 User nonaktif yang dulu pernah menilai tetap tercatat sebagai assessor histori

Expected result:

- Relasi histori tidak rusak

## 12. Smoke Test MVP

Checklist smoke test minimal sebelum demo internal:

- [ ] Login admin berhasil
- [ ] Login supervisor berhasil
- [ ] Tambah petugas berhasil
- [ ] Tambah user berhasil
- [ ] Input assessment `PRESENT` berhasil
- [ ] Input assessment `ABSENT` berhasil
- [ ] Duplicate assessment ditolak
- [ ] Dashboard menampilkan data
- [ ] Dashboard empty state tampil saat data kosong
- [ ] Generate reward/punishment berhasil
- [ ] Approve atau reject berhasil
- [ ] Export Excel berhasil
- [ ] Export PDF berhasil
- [ ] Audit log tercatat pada aksi penting

## 13. Rekomendasi Pengembangan Automated Test

Urutan yang direkomendasikan saat nanti membuat automated tests:

1. Unit test:
   - helper scoring
   - validasi Zod
   - reward threshold logic
2. Integration test:
   - create/update assessment
   - generate reward/punishment
   - auth guard API
3. End-to-end test:
   - login
   - CRUD petugas
   - input assessment
   - export laporan
