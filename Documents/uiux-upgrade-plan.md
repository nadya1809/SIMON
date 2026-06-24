# UI/UX Upgrade Plan SIMON PST

## Tujuan

Dokumen ini menjadi planning final untuk full upgrade UI/UX website `SIMON PST` dengan pendekatan adaptasi dari referensi dashboard admin yang diberikan user, sambil tetap menjaga identitas `SIMON PST` dan `BPS Provinsi Sumatera Barat`.

## Arah Desain yang Disepakati

- Pendekatan: adaptasi referensi, bukan menyalin mentah.
- Brand tetap memakai `SIMON PST` dan logo `BPS PST`.
- Layout utama: sidebar ramping seperti referensi, topbar tipis, area konten lebar.
- Profil user dipindahkan ke area kanan atas topbar.
- Gaya visual: modern, friendly, clean, profesional.
- Nuansa tetap memiliki gradien lembut.
- Warna utama mengikuti palet biru BPS yang diinferensikan dari identitas visual/logo BPS.
- Aksen emas dihapus.
- Chart dibuat lebih clean dengan grid tipis dan warna pastel.
- Table dibuat sangat clean dan tipis seperti referensi.
- Aksi baris dipindahkan ke menu `...`.
- Semua halaman list memakai toolbar filter horizontal dengan CTA utama di kanan atas.
- Dialog tetap besar seperti sekarang.
- Icon set: Font Awesome.
- Empty state dibuat lebih modern dengan ilustrasi/icon ringan.
- Badge status dibuat lebih lembut dan ringkas.
- Semua halaman memakai judul dan subtitle.
- Fokus implementasi: desktop dulu.
- Semua halaman ikut direfresh.
- Dark mode tidak masuk scope.
- Struktur form kompleks dipecah menjadi section modular.
- Harus memakai shared/global/reusable components agar tidak DRY.

## Palet Visual

Catatan: BPS tidak mudah ditemukan memiliki brand guide digital publik dengan kode hex resmi lengkap. Karena itu, palet di bawah ini adalah palet kerja yang diinferensikan dari logo/identitas visual resmi BPS dan cocok untuk web admin UI modern.

- `BPS Blue 700`: `#005B9A`
- `BPS Blue 600`: `#0A6FB6`
- `BPS Sky 500`: `#33A9E0`
- `BPS Teal 500`: `#2BA7A0`
- `BPS Mist 100`: `#EAF4FB`
- `BPS Surface`: `#F7FAFD`
- `BPS Border`: `#D8E4EF`
- `Text Primary`: `#183247`
- `Text Secondary`: `#6B8193`

## Referensi Warna

- Logo BPS official homepage: `https://www.bps.go.id/`
- File logo BPS publik: `https://commons.wikimedia.org/wiki/File:Lambang_Badan_Pusat_Statistik_(BPS)_Indonesia.svg`

## Prinsip Upgrade

1. Ubah fondasi layout dan komponen dulu, baru halaman.
2. Semua pola UI harus reusable.
3. Satu bahasa visual untuk dashboard, CRUD, form, tabel, chart, dan empty states.
4. Setiap halaman harus terasa satu keluarga produk.
5. Hindari hardcode styling berulang di banyak file.

## Fase Implementasi

## Fase 1 — Design Foundation

Fokus:

- Menetapkan tokens warna baru berbasis BPS blue palette.
- Menetapkan typography, spacing, radius, border, shadow, dan gradien.
- Menentukan icon guideline berbasis Font Awesome.
- Menentukan state guideline untuk `hover`, `active`, `focus`, `disabled`, `error`, `success`, dan `warning`.

Output:

- `ui-rules.md`
- update `globals.css` dan token global
- daftar komponen yang wajib direfactor

Checklist:

- [x] Tetapkan color tokens utama dan semantic tokens
- [x] Tetapkan skala spacing global
- [x] Tetapkan skala radius global
- [x] Tetapkan shadow system
- [x] Tetapkan tipografi heading/body/helper
- [x] Tetapkan style grid/chart/table/form
- [x] Tetapkan aturan icon Font Awesome

## Fase 2 — App Shell Redesign

Fokus:

- Mengubah layout utama dashboard menjadi sidebar ramping + topbar tipis.
- Memindahkan profil user ke kanan atas.
- Membuat shell yang terasa ringan, lapang, dan modern.
- Menyiapkan responsive structure desktop-first.

Output:

- redesign `src/app/(dashboard)/layout.tsx`
- redesign `dashboard-shell`
- redesign `sidebar-nav`
- topbar baru reusable

Checklist:

- [x] Buat sidebar ramping dengan struktur section menu
- [x] Tambahkan brand area `SIMON PST` + logo BPS PST
- [x] Tambahkan topbar reusable
- [x] Pindahkan identitas user ke topbar kanan
- [x] Rapikan container width, gap, padding, dan content rhythm
- [ ] Siapkan perilaku collapse untuk mobile tanpa fokus implementasi penuh dulu

## Fase 3 — Shared Component System Upgrade

Fokus:

- Mengubah semua komponen dasar agar selaras dengan referensi.
- Menghapus style yang tersebar dan memusatkannya ke shared components.

Output:

- shared components versi baru
- varian komponen yang lebih kaya namun tetap konsisten

Checklist:

- [x] Refactor `Button`
- [x] Refactor `Badge`
- [x] Refactor `Input`
- [x] Refactor `Select`
- [x] Refactor `Textarea`
- [x] Refactor `Dialog`
- [x] Refactor `Table`
- [x] Buat `PageHeader`
- [x] Buat `Topbar`
- [x] Buat `FilterToolbar`
- [x] Buat `StatCard`
- [x] Buat `SectionCard`
- [x] Buat `ActionMenu` untuk `...`
- [x] Buat `EmptyState` modern dengan icon ringan
- [x] Buat `FormSection`
- [x] Buat `DataTableShell`

## Fase 4 — Dashboard Redesign

Fokus:

- Menjadikan dashboard sebagai halaman acuan visual.
- Menyesuaikan stat cards, chart cards, filter bar, dan ranking table.

Output:

- dashboard baru yang paling dekat dengan referensi namun tetap branded BPS

Checklist:

- [x] Ubah susunan header dashboard
- [x] Ubah summary cards jadi lebih clean
- [ ] Rapikan visual chart container
- [ ] Gunakan warna chart pastel berbasis palet BPS
- [ ] Tipiskan grid dan axis chart
- [x] Rapikan ranking table
- [x] Samakan subtitle/copywriting
- [x] Pastikan whitespace dan hierarchy lebih kuat
- [x] Rapikan visual chart container
- [x] Gunakan warna chart pastel berbasis palet BPS
- [x] Tipiskan grid dan axis chart

## Fase 5 — Redesign Halaman Data Management

Scope:

- `Unit`
- `Petugas`
- `Kriteria`
- `User`
- `Reports`
- `Reward & Punishment`
- `Assessments`

Fokus:

- Menyatukan pola halaman list.
- Toolbar filter konsisten.
- CTA utama selalu kanan atas.
- Action row menggunakan menu `...`.

Checklist:

- [x] Semua halaman list memakai `PageHeader`
- [x] Semua halaman list memakai `FilterToolbar`
- [x] Semua halaman list memakai `DataTableShell`
- [x] Semua halaman row action pindah ke `ActionMenu`
- [x] Semua badge status dilembutkan
- [x] Semua empty state diperbarui
- [x] Semua table spacing dibuat lebih tipis dan clean
- [x] Semua subtitle halaman dirapikan

## Fase 6 — Form UX Refactor

Fokus:

- Membuat form lebih modular dan mudah dipindai.
- Sangat penting untuk halaman `Assessment` dan `Reward & Punishment`.

Checklist:

- [x] Pecah form panjang menjadi section modular
- [x] Tambahkan judul kecil per section
- [x] Tambahkan helper text yang ringkas
- [x] Standarkan error state
- [x] Standarkan success/loading state
- [x] Pastikan destructive action jelas
- [x] Rapikan grid 2 kolom untuk desktop bila cocok

## Fase 7 — Table UX Refactor

Fokus:

- Menyamakan semua tabel ke style referensi.

Checklist:

- [ ] Header tabel lebih ringan
- [ ] Border lebih tipis
- [ ] Row action jadi `...`
- [ ] Toolbar filter horizontal
- [ ] Pagination lebih modern
- [ ] Rows-per-page lebih rapi
- [ ] Status chip konsisten
- [ ] Search empty state dan no result state dibedakan

## Fase 8 — Empty, Loading, Feedback, and Motion

Fokus:

- Memperhalus pengalaman interaksi agar terasa matang.

Checklist:

- [ ] Loading skeleton untuk list dan card
- [ ] Hover state lebih halus
- [ ] Active nav state lebih jelas
- [ ] Empty state modern
- [ ] Sonner styling diselaraskan dengan visual baru
- [ ] Focus ring aksesibel
- [ ] Motion ringan, tidak berlebihan

## Fase 9 — Responsive Desktop-First Pass

Fokus:

- Menjaga kualitas desktop sebagai prioritas, sambil menyiapkan dasar mobile.

Checklist:

- [ ] Desktop layout final
- [ ] Tablet layout aman
- [ ] Sidebar siap menjadi drawer di mobile
- [ ] Toolbar filter tetap usable pada layar sempit
- [ ] Tabel panjang tetap terbaca

## Fase 10 — QA UI Consistency Sweep

Fokus:

- Audit visual dan struktural seluruh aplikasi.

Checklist:

- [ ] Audit semua spacing
- [ ] Audit semua heading/subtitle
- [ ] Audit semua card style
- [ ] Audit semua form label/helper/error
- [ ] Audit semua table toolbar/action
- [ ] Audit semua badge/status
- [ ] Audit semua chart palette
- [ ] Audit semua empty state
- [ ] Audit topbar/sidebar consistency

## Task Breakdown Eksekusi

## Batch A — Foundation

- [x] Buat `ui-rules.md`
- [x] Update tokens di `globals.css`
- [x] Siapkan Font Awesome dependency plan
- [x] Buat daftar shared components target

## Batch B — Shell

- [x] Refactor `layout.tsx` dashboard
- [x] Refactor `dashboard-shell.tsx`
- [x] Refactor `sidebar-nav.tsx`
- [x] Buat `topbar.tsx`
- [x] Tambahkan placement profile kanan atas

## Batch C — Shared Components

- [x] Buat `page-header.tsx`
- [x] Buat `filter-toolbar.tsx`
- [x] Buat `section-card.tsx`
- [x] Buat `stat-card.tsx`
- [x] Buat `action-menu.tsx`
- [x] Upgrade `table.tsx`
- [x] Upgrade `dialog.tsx`
- [x] Upgrade input family
- [x] Upgrade badge/button

## Batch D — Dashboard

- [x] Refactor halaman dashboard utama
- [ ] Refactor chart wrappers
- [x] Sesuaikan filter dashboard
- [x] Rapikan ranking section

## Batch E — CRUD Pages

- [x] Refactor halaman unit
- [x] Refactor halaman petugas
- [x] Refactor halaman kriteria
- [x] Refactor halaman user
- [ ] Refactor halaman laporan
- [ ] Refactor halaman reward/punishment
- [ ] Refactor halaman assessment

## Batch F — Form Modularity

- [ ] Pecah assessment form menjadi section
- [ ] Pecah reward/punishment form menjadi section
- [ ] Review dialog form lain agar konsisten

## Batch G — Final Polish

- [ ] Style Sonner final
- [ ] Loading skeleton pass
- [ ] Empty states pass
- [ ] Accessibility visual pass
- [ ] Desktop QA pass

## Template Prompt AI Agent

Section ini dipakai sebagai prompt global singkat saat membuka chat baru dengan AI agent.

```text
Gunakan Documents/uiux-upgrade-plan.md dan Documents/ui-rules.md sebagai source of truth untuk redesign UI/UX SIMON PST.

Konteks proyek:
- Brand tetap: SIMON PST + BPS Provinsi Sumatera Barat
- Gaya: adaptasi dashboard admin modern, clean, friendly, profesional
- Layout: sidebar ramping, topbar tipis, desktop-first
- User profile: kanan atas topbar
- Warna utama: palette biru BPS
- Nuansa visual: tetap ada gradien lembut
- Icon set: Font Awesome
- Tabel: clean, tipis, action row pakai menu `...`
- Toolbar list: filter horizontal, CTA utama di kanan atas
- Form kompleks: modular per section
- Dialog: tetap besar
- Dark mode: tidak masuk scope
- Bahasa UI: Indonesia

Aturan implementasi:
- prioritaskan shared/reusable/global components
- hindari DRY
- jangan ubah business logic kecuali diperlukan untuk kebutuhan UI
- pertahankan struktur data dan route yang sudah ada jika tidak perlu diubah
- semua halaman harus konsisten mengikuti ui-rules

Saat mengerjakan:
1. audit file terkait
2. tentukan komponen shared yang perlu dibuat atau direfactor
3. implementasikan perubahan
4. verifikasi hasilnya tetap konsisten dan rapi
5. jika memungkinkan, jalankan lint/build

Output yang diharapkan:
- implementasi UI/UX yang siap pakai
- reusable components lebih kuat
- styling lama yang berulang dikurangi
- hasil visual konsisten di seluruh dashboard
```

## Risiko dan Catatan

- Font Awesome perlu dipakai konsisten. Jangan campur banyak gaya icon.
- Table action `...` butuh pola reusable agar tidak diulang di tiap halaman.
- Assessment dan reward/punishment kemungkinan butuh effort paling besar karena form dan data density tinggi.
- Karena semua halaman masuk scope, shared component layer harus selesai lebih dulu.
- Palet warna BPS di dokumen ini adalah working palette hasil inferensi visual, bukan brand guideline hex resmi yang saya temukan dipublikasikan.

## Definisi Selesai

Upgrade UI/UX dianggap selesai jika:

- semua halaman dashboard memakai shell baru
- semua halaman memakai komponen shared
- tidak ada styling penting yang hardcoded berulang tanpa alasan
- semua halaman list memiliki toolbar + CTA kanan atas + action menu `...`
- semua form utama modular
- semua chart, table, badge, dialog, dan empty state konsisten
- desktop experience sudah rapi dan terasa satu sistem
