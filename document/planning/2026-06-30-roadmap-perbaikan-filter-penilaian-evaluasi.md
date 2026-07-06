# Planning Perbaikan SIMON PST

Tanggal: 2026-06-30

## Ringkasan Keputusan

1. Filter waktu diterapkan sekalian ke seluruh modul terkait:
   - Penilaian Harian
   - Laporan
   - Dashboard
   - Reward, Punishment, dan Evaluasi
2. Preset waktu menggunakan rolling range ke belakang dari hari ini:
   - Semua
   - Hari ini
   - 1 minggu = 7 hari
   - 1 bulan = 30 hari
   - 3 bulan = 90 hari
   - 6 bulan = 180 hari
   - 1 tahun = 365 hari
3. Pencarian petugas pada modal input penilaian menggunakan:
   - search box
   - daftar hasil pencarian langsung
   - pencarian nama dan NIP
4. Terminologi `Posisi` diubah penuh menjadi `Jabatan` tanpa sisa, termasuk UI, validasi, API, dan data/schema bila dibutuhkan.
5. Tipe baru menggunakan Bahasa Indonesia:
   - `EVALUASI` di data internal
   - `Evaluasi` di tampilan UI
6. Generate rekomendasi memakai:
   - jenis periode
   - tanggal acuan
7. Periode mingguan wajib mengikuti hari kerja:
   - otomatis tarik ke Jumat terakhir bila tanggal acuan jatuh di luar jangkauan kerja
   - basis minggu kerja adalah Senin sampai Jumat
8. Reward dan punishment boleh ter-generate sekaligus sesuai kandidat yang memenuhi.
9. Threshold reward/punishment tetap menggunakan aturan saat ini.
10. Implementasi dikerjakan bertahap dalam beberapa fase.

## Rekomendasi Desain Untuk Evaluasi

Pilihan terbaik agar reward, punishment, dan evaluasi berjalan rapi adalah:

- `Evaluasi` disimpan sebagai tipe baru setara dengan reward dan punishment.
- `Evaluasi` tidak memakai threshold reward/punishment.
- `Evaluasi` berfungsi sebagai hasil rekap netral berbasis periode, agar pimpinan bisa meninjau performa tanpa memaksa hasil menjadi reward atau punishment.
- Reward dan punishment tetap memakai threshold yang ada.
- Dengan model ini:
  - evaluasi bisa dipakai sebagai bahan review periodik
  - reward dan punishment tetap objektif
  - data historis lebih bersih karena tipe netral tidak dipaksa masuk ke salah satu kategori sanksi/apresiasi

## Target Hasil Akhir

Setelah seluruh fase selesai:

- user bisa memfilter seluruh modul dengan preset waktu yang seragam
- user bisa mencari petugas lebih cepat saat input penilaian
- istilah `Jabatan` konsisten di semua tempat
- modul reward/punishment berevolusi menjadi modul `Evaluasi, Reward, dan Punishment`
- generate data bisa dilakukan per hari, minggu kerja, bulan, 3 bulan, 6 bulan, dan 1 tahun
- data evaluasi netral dan data reward/punishment berbasis threshold bisa hidup berdampingan

## Milestone 1: Filter Waktu Global

### Tujuan

Menyatukan pola filter waktu di semua modul yang memakai data assessment atau rekomendasi.

### Cakupan

- Tambah preset:
  - Semua
  - Hari ini
  - 1 minggu
  - 1 bulan
  - 3 bulan
  - 6 bulan
  - 1 tahun
- Terapkan ke:
  - halaman Penilaian Harian
  - halaman Dashboard
  - halaman Laporan
  - halaman Reward, Punishment, dan Evaluasi
- Sediakan helper tanggal/range terpusat supaya seluruh query memakai aturan yang sama.

### Pekerjaan Teknis

- buat util range waktu global
- ubah state filter frontend
- ubah query API/backend agar mendukung preset waktu
- sinkronkan label filter, reset filter, dan default value

### Risiko

- hasil antar halaman bisa berbeda jika helper tanggal tidak dipusatkan
- perlu hati-hati pada timezone dan date-only

### Kriteria Selesai

- preset waktu tampil konsisten di semua modul
- hasil filter antara dashboard, laporan, dan penilaian sinkron

## Milestone 2: Search Petugas Pada Modal Input Penilaian

### Tujuan

Mempercepat pemilihan petugas saat input penilaian baru.

### Cakupan

- ganti select petugas biasa menjadi searchable picker
- tampilkan daftar hasil pencarian langsung
- dukung pencarian nama dan NIP
- tetap aman untuk submit form dan edit data existing

### Pekerjaan Teknis

- buat komponen picker petugas atau autocomplete
- kelola state query, hasil filter, item aktif, dan item terpilih
- hubungkan ke `react-hook-form`

### Risiko

- navigasi keyboard dan closing dropdown harus rapi
- wajib tetap nyaman dipakai di mobile

### Kriteria Selesai

- user bisa ketik nama/NIP
- hasil muncul langsung
- pilih petugas tidak lagi bergantung pada scroll dropdown panjang

## Milestone 3: Rename Penuh Posisi Menjadi Jabatan

### Tujuan

Menghilangkan seluruh istilah `Posisi` dan menggantinya secara penuh dengan `Jabatan`.

### Cakupan

- label form
- placeholder
- header tabel
- hint
- validasi
- type/interface
- API payload
- field schema/database bila diperlukan

### Pekerjaan Teknis

- audit semua pemakaian `position`
- rename field kode ke nama baru yang konsisten
- buat migration schema bila kolom database ikut diganti
- perbarui semua halaman yang memakai data petugas

### Risiko

- rename parsial akan meninggalkan kebingungan jangka panjang
- rename schema perlu pengujian CRUD petugas

### Kriteria Selesai

- tidak ada istilah `Posisi` tersisa di UI
- tidak ada pemakaian field lama tersisa di code path aktif

## Milestone 4: Refactor Modul Menjadi Evaluasi, Reward, dan Punishment

### Tujuan

Mengubah modul rekomendasi bulanan menjadi modul evaluasi periodik yang lebih fleksibel.

### Cakupan Fungsional

- tambah tipe baru:
  - Evaluasi
  - Reward
  - Punishment
- ubah form generate agar memakai:
  - jenis periode
  - tanggal acuan
  - jenis generate
- dukung periode:
  - Harian
  - Mingguan kerja
  - Bulanan
  - 3 bulanan
  - 6 bulanan
  - 1 tahunan
- mingguan kerja:
  - wajib Senin sampai Jumat
  - bila tanggal acuan bukan hari kerja yang valid, sistem tarik ke Jumat terakhir
- reward dan punishment tetap threshold-based
- evaluasi bersifat netral dan rekap-oriented

### Rekomendasi Perilaku Sistem

- Jika user memilih `Evaluasi`:
  - sistem menghasilkan entitas evaluasi netral
  - tidak memaksa threshold
  - tetap menyimpan skor pemicu/agregat periode
- Jika user memilih `Reward` atau `Punishment`:
  - sistem hanya membuat kandidat yang lolos threshold terkait
- Jika user memilih mode yang memperbolehkan lebih dari satu hasil:
  - reward dan punishment boleh terbentuk sekaligus untuk petugas yang berbeda

### Pekerjaan Teknis

- ubah schema validasi generate
- refactor helper period di backend
- refactor agregasi assessment untuk berbagai horizon waktu
- tambah tipe baru di model data
- sesuaikan daftar rekomendasi, filter, detail modal, dan approval flow
- sesuaikan label UI dan deskripsi modul

### Risiko

- ini fase dengan dampak terbesar
- kemungkinan butuh migration Prisma
- perlu menjaga backward compatibility data lama bulanan

### Kriteria Selesai

- user bisa generate berdasarkan semua jenis periode
- user bisa generate evaluasi netral
- reward/punishment lama tetap terbaca
- approval/reject tetap berjalan

## Milestone 5: Integrasi, Migrasi, dan Quality Check

### Tujuan

Menutup perubahan besar dengan stabilisasi sistem.

### Cakupan

- migrasi dan verifikasi data lama
- sinkronisasi dashboard/laporan/export
- audit istilah UI
- smoke test seluruh alur utama

### Checklist Uji

- tambah petugas dengan field `Jabatan`
- edit dan hapus petugas tetap aman
- input penilaian baru via search petugas
- filter waktu bekerja di semua modul
- generate evaluasi per hari
- generate reward/punishment per minggu kerja
- generate untuk 1 bulan, 3 bulan, 6 bulan, 1 tahun
- lihat detail hasil generate
- approve/reject tetap berjalan
- laporan/export tetap konsisten

## Urutan Implementasi Yang Disarankan

1. Milestone 1
2. Milestone 2
3. Milestone 3
4. Milestone 4
5. Milestone 5

Urutan ini dipilih karena:

- filter waktu akan dipakai lintas modul
- search petugas memberi dampak UX cepat dengan risiko rendah
- rename `Jabatan` sebaiknya selesai sebelum refactor besar modul evaluasi
- modul evaluasi/reward/punishment adalah perubahan paling berat dan paling aman dikerjakan setelah fondasi tanggal dan istilah stabil

## Catatan Implementasi

- Semua helper tanggal sebaiknya dipusatkan pada util bersama.
- Semua filter waktu sebaiknya berbasis source of truth yang sama agar dashboard, laporan, dan rekomendasi tidak berbeda hasil.
- Rename `Posisi` ke `Jabatan` harus full rename, bukan label-only.
- Untuk schema baru modul evaluasi, sebaiknya desain data mendukung:
  - `type`
  - `periodKind`
  - `referenceDate`
  - `periodStart`
  - `periodEnd`
  - `triggerScore`
  - `status`
  - `category`
  - `notes`

## Deliverable Dokumen Lanjutan Yang Disarankan

Setelah planning ini disetujui, tahap berikutnya sebaiknya dibuat:

1. technical design schema migration
2. breakdown task per milestone
3. acceptance criteria per halaman
4. checklist QA manual
