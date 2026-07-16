# Planning

Folder ini dipakai sebagai titik masuk semua rencana pengembangan fitur di SIMON PST.

## Mulai Dari Sini

Kalau ingin mulai mengerjakan fitur notifikasi, baca dokumen ini dengan urutan berikut:

1. [Notification Feature Plan](../notification-feature-plan.md)
2. lanjut ke `Fase 1: Fondasi Backend`
3. setelah backend siap, lanjut ke `Fase 2: API Notifikasi`
4. lalu integrasikan event bisnis pada `Fase 3`
5. terakhir bangun UI topbar pada `Fase 4`

## Rekomendasi Urutan Kerja

Urutan paling aman untuk memulai:

1. Tambah schema Prisma untuk notifikasi
2. Buat migration database
3. Buat helper backend notifikasi di `src/lib`
4. Buat API notifikasi
5. Sambungkan notifikasi ke modul `reward-punishment`
6. Tampilkan unread badge dan dropdown di topbar

## Checklist Mulai Implementasi

- [x] Review [Notification Feature Plan](../notification-feature-plan.md)
- [x] Tentukan final field model `Notification`
- [x] Buat migration Prisma
- [x] Buat helper `src/lib/notifications.ts`
- [x] Buat endpoint `GET /api/notifications`
- [x] Buat endpoint `PATCH /api/notifications/[id]/read`
- [x] Buat endpoint `PATCH /api/notifications/read-all`
- [x] Integrasikan notifikasi pada generate reward-punishment
- [x] Integrasikan notifikasi pada approve/reject reward-punishment
- [x] Tambahkan UI bell notifikasi di topbar

## Progress Saat Ini

- [x] MVP notifikasi backend selesai
- [x] MVP topbar bell notifikasi selesai
- [x] Halaman daftar notifikasi penuh
- [ ] Penyempurnaan UX dan polling lanjutan

## Dokumen Terkait

- [Notification Feature Plan](../notification-feature-plan.md)
- [Global UI Refactor Plan](../global-ui-refactor-plan.md)
