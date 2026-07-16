# Notification Feature Plan

## Tujuan

Menambahkan fitur notifikasi internal pada aplikasi SIMON PST agar pengguna bisa:

- mengetahui adanya data `Evaluasi, Reward, dan Punishment` yang baru dibuat
- mengetahui adanya rekomendasi yang masih menunggu keputusan
- melihat riwayat notifikasi yang belum atau sudah dibaca
- langsung menuju modul terkait dari topbar

Fokus awal fitur ini adalah notifikasi yang benar-benar memiliki nilai operasional, bukan sekadar informasi pasif.

## Rekomendasi MVP

Fitur notifikasi tahap pertama difokuskan pada modul `Evaluasi, Reward, dan Punishment`.

Jenis notifikasi MVP:

1. `RECOMMENDATION_GENERATED`
- dikirim saat proses generate data evaluasi, reward, atau punishment berhasil membuat data baru
- target utama: `ADMIN` dan `SUPERVISOR`

2. `RECOMMENDATION_PENDING_APPROVAL`
- dikirim saat ada data berstatus `RECOMMENDED` yang perlu diputuskan
- target utama: `PIMPINAN`, bisa juga `ADMIN` jika diperlukan

3. `RECOMMENDATION_APPROVED`
- dikirim saat data disetujui
- target utama: `ADMIN` dan `SUPERVISOR`

4. `RECOMMENDATION_REJECTED`
- dikirim saat data ditolak
- target utama: `ADMIN` dan `SUPERVISOR`

## Scope Tahap 1

Termasuk:

- badge unread di ikon notifikasi pada topbar
- panel dropdown notifikasi saat ikon bell diklik
- penyimpanan notifikasi ke database
- penandaan `sudah dibaca`
- tautan langsung ke modul `/reward-punishment`
- API untuk mengambil daftar notifikasi user aktif

Tidak termasuk dulu:

- realtime via WebSocket
- push notification browser
- email
- reminder penilaian harian otomatis via scheduler
- broadcast notifikasi massal manual dari admin

## Alur Pengguna

### 1. Generate data rekomendasi

- Admin atau Supervisor melakukan generate pada modul `Evaluasi, Reward, dan Punishment`
- sistem membuat data rekomendasi
- sistem juga membuat notifikasi untuk role yang ditentukan
- pengguna melihat badge bertambah pada ikon bell

### 2. Melihat notifikasi

- pengguna klik ikon bell di topbar
- dropdown menampilkan daftar notifikasi terbaru
- tiap item berisi judul, pesan singkat, waktu, dan status baca
- klik item akan membuka halaman terkait

### 3. Menyetujui atau menolak rekomendasi

- Pimpinan membuka detail rekomendasi
- saat status diubah menjadi `APPROVED` atau `REJECTED`
- sistem membuat notifikasi hasil keputusan

## Struktur Data yang Disarankan

Gunakan model notifikasi per user agar implementasi MVP tetap sederhana.

### Model `Notification`

Field yang disarankan:

- `id`
- `userId`
- `type`
- `title`
- `message`
- `href`
- `entity`
- `entityId`
- `isRead`
- `readAt`
- `createdAt`
- `metadata` opsional dalam bentuk `Json`

### Enum `NotificationType`

Enum awal yang disarankan:

- `RECOMMENDATION_GENERATED`
- `RECOMMENDATION_PENDING_APPROVAL`
- `RECOMMENDATION_APPROVED`
- `RECOMMENDATION_REJECTED`

## Integrasi Dengan Struktur Aplikasi Saat Ini

Titik integrasi paling cocok di codebase saat ini:

1. `prisma/schema.prisma`
- tambah model dan enum notifikasi

2. `src/lib`
- buat helper notifikasi, misalnya:
  - `src/lib/notifications.ts`
  - fungsi create notification
  - fungsi create many notifications by role
  - fungsi mark as read

3. `src/app/api`
- tambah endpoint:
  - `GET /api/notifications`
  - `PATCH /api/notifications/[id]/read`
  - opsional `PATCH /api/notifications/read-all`

4. `src/components/dashboard/topbar.tsx`
- ubah ikon bell menjadi komponen interaktif
- tampilkan badge unread
- tampilkan dropdown/panel daftar notifikasi

5. `src/app/api/reward-punishment/route.ts`
- setelah generate berhasil, buat notifikasi

6. `src/app/api/reward-punishment/[id]/route.ts`
- setelah approve atau reject berhasil, buat notifikasi lanjutan

## Desain UI yang Disarankan

### Topbar Notification Bell

- tetap memakai ikon bell yang sudah ada
- tampilkan badge bulat kecil jumlah unread
- jika unread lebih dari 9, tampilkan `9+`

### Notification Dropdown

Isi panel:

- header: `Notifikasi`
- tombol `Tandai semua dibaca`
- daftar item notifikasi
- link `Lihat semua` jika nanti halaman khusus ditambahkan

### Notification Item

Setiap item menampilkan:

- icon kecil sesuai tipe notifikasi
- judul singkat
- pesan singkat
- waktu relatif atau tanggal ringkas
- indikator unread

Contoh:

- `Generate selesai`
  `5 data evaluasi baru berhasil dibuat dan menunggu tindak lanjut.`

- `Menunggu keputusan`
  `3 data reward atau punishment masih berstatus rekomendasi.`

- `Keputusan disetujui`
  `Reward untuk petugas X telah disetujui.`

## Rencana Implementasi Bertahap

### Fase 1: Fondasi Backend

Status: `Selesai`

- tambah enum dan model notifikasi di Prisma
- buat migration
- buat helper notifikasi di `src/lib`
- buat query dasar daftar notifikasi user

Output:

- database siap
- notifikasi bisa dibuat dan dibaca dari server

### Fase 2: API Notifikasi

Status: `Selesai`

- buat `GET /api/notifications`
- buat `PATCH /api/notifications/[id]/read`
- buat `PATCH /api/notifications/read-all`
- pastikan hanya user login yang bisa mengakses notifikasinya sendiri

Output:

- data notifikasi dapat diambil dari client
- status baca bisa diubah

### Fase 3: Integrasi Event Reward-Punishment

Status: `Selesai`

- saat generate berhasil, buat notifikasi terkait
- saat approve berhasil, buat notifikasi hasil keputusan
- saat reject berhasil, buat notifikasi hasil keputusan

Output:

- notifikasi benar-benar terisi dari proses bisnis utama

### Fase 4: UI Topbar

Status: `Selesai`

- ganti tombol bell di topbar menjadi notification trigger
- tampilkan unread count
- tampilkan dropdown notifikasi
- klik notifikasi membuka link terkait

Output:

- pengguna bisa melihat notifikasi dari UI utama

### Fase 5: Penyempurnaan

Status: `Berjalan`

- tambahkan empty state
- tambahkan loading state
- rapikan copywriting notifikasi
- tambahkan polling ringan bila diperlukan, misalnya setiap 30-60 detik
- tambahkan reminder operasional ringan untuk penilaian harian yang belum lengkap

Output:

- pengalaman penggunaan lebih matang

## Risiko dan Antisipasi

### 1. Notifikasi terlalu banyak

Risiko:

- notifikasi membanjiri user

Antisipasi:

- batasi MVP hanya pada event penting
- gunakan role-based targeting

### 2. Data notifikasi ganda

Risiko:

- event generate atau keputusan bisa membuat notifikasi duplikat

Antisipasi:

- definisikan aturan pembuatan notifikasi per event dengan jelas
- simpan `entity + entityId + type` di metadata jika perlu kontrol deduplikasi

### 3. Dropdown topbar terlalu berat

Risiko:

- topbar menjadi lambat jika setiap halaman memuat notifikasi berlebihan

Antisipasi:

- ambil hanya 5-10 notifikasi terbaru
- hitung unread count secara terpisah

## Acceptance Criteria MVP

Fitur dianggap selesai jika:

1. generate rekomendasi berhasil membuat notifikasi ke user target
2. approve atau reject rekomendasi berhasil membuat notifikasi hasil keputusan
3. ikon bell di topbar menampilkan jumlah unread
4. user bisa membuka dropdown dan melihat daftar notifikasi
5. user bisa menandai notifikasi sebagai dibaca
6. klik notifikasi membawa user ke modul terkait
7. notifikasi hanya bisa diakses oleh user yang berhak

## Rekomendasi Eksekusi Berikutnya

Urutan kerja yang paling aman:

1. buat schema Prisma notifikasi
2. buat helper backend notifikasi
3. integrasikan ke event `reward-punishment`
4. bangun UI topbar bell dan dropdown
5. uji end-to-end dengan role `ADMIN` dan `PIMPINAN`

## Catatan Implementasi

Untuk menjaga konsistensi dengan codebase sekarang:

- gunakan pola API route yang sudah ada
- gunakan `requireApiAuth` atau `requireApiRoles`
- gunakan komponen UI existing seperti `Badge`, `Button`, `SectionCard`, dan pola panel topbar yang sudah dipakai
- gunakan toast hanya untuk feedback instan, sedangkan notifikasi database untuk hal yang harus bisa dilihat ulang
