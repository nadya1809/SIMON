# QA Status SIMON PST

Dokumen ini mencatat verifikasi yang sudah bisa dijalankan ulang dari repo saat ini.

## Smoke Check Otomatis

Gunakan perintah berikut:

```powershell
pnpm qa:smoke
```

Smoke check ini membuat data temporary, melakukan verifikasi inti, lalu membersihkan data tersebut kembali. Cakupan saat ini:

- seed criteria aktif tersedia
- dashboard menghitung data `PRESENT` dan `ABSENT` dengan benar
- kandidat reward bulanan muncul dari agregasi skor `PRESENT`
- service report menghasilkan baris laporan dan ranking
- audit log dapat menyimpan jejak perubahan penting

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
