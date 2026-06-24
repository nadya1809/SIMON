# QA Status SIMON PST

Dokumen ini mencatat verifikasi yang sudah bisa dijalankan ulang dari repo saat ini.

## Smoke Check Otomatis

Gunakan perintah berikut:

```powershell
pnpm qa:smoke
```

Smoke check ini membuat data temporary, melakukan verifikasi inti, lalu membersihkan data tersebut kembali. Cakupan saat ini:

- login user aktif berhasil
- login password salah ditolak
- login user nonaktif ditolak
- create dan update user temporary berhasil
- create dan update petugas temporary berhasil
- create dan update kriteria temporary berhasil
- seed criteria aktif tersedia
- duplicate assessment ditolak oleh unique constraint
- dashboard tanpa data menghasilkan total 0
- dashboard menghitung data `PRESENT` dan `ABSENT` dengan benar
- kandidat reward bulanan muncul dari agregasi skor `PRESENT`
- export Excel menghasilkan buffer file
- export PDF menghasilkan buffer file
- service report menghasilkan baris laporan dan ranking
- histori officer nonaktif tetap bisa dibaca
- audit log dapat menyimpan jejak create, update, dan delete

## Verifikasi Build

Perintah yang harus lulus:

```powershell
pnpm lint
pnpm build
```

## Catatan

- Smoke check memakai database aktif pada `.env`
- Data temporary memakai prefix `qa-smoke-*`
- Jika smoke check gagal di tengah, cek tabel `Unit`, `Officer`, `DailyAssessment`, dan `AuditLog` untuk memastikan data temporary sudah terhapus
