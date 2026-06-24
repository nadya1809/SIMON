# UI Rules SIMON PST

## Tujuan

Dokumen ini menjadi rulebook UI global untuk redesign `SIMON PST` agar implementasi konsisten, reusable, dan tidak DRY.

## Prinsip Utama

1. Gunakan shared component lebih dulu sebelum menulis styling lokal.
2. Jika pola dipakai 2 kali atau lebih, ekstrak menjadi reusable component.
3. Jangan hardcode warna, radius, shadow, atau spacing di halaman jika sudah ada token global.
4. Semua halaman harus mengikuti shell yang sama.
5. Semua list page harus memakai pola header + toolbar + content card.

## Brand Rules

- Nama produk utama: `SIMON PST`
- Identitas institusi: `BPS Provinsi Sumatera Barat`
- Logo: `SIMON PST` + logo `BPS PST`
- Tone visual: modern, friendly, profesional, clean

## Color Rules

Gunakan semantic tokens, bukan hex langsung di komponen.

### Core Tokens

- `--background`
- `--foreground`
- `--muted`
- `--card`
- `--surface`
- `--surface-strong`
- `--border`
- `--accent`
- `--accent-strong`
- `--accent-soft`

### Semantic Tokens yang Disarankan

- `--success-bg`
- `--success-fg`
- `--warning-bg`
- `--warning-fg`
- `--danger-bg`
- `--danger-fg`
- `--info-bg`
- `--info-fg`

### Rules

- Warna primer tetap di keluarga biru BPS.
- Jangan pakai emas lagi sebagai aksen utama.
- Gradien boleh dipakai, tapi halus dan terbatas pada shell, stat hero, atau highlight.
- Chart memakai versi pastel dari palette utama.

## Typography Rules

- Heading harus tegas tapi tetap ramah.
- Subtitle harus lebih pendek dan mudah dipindai.
- Body text jangan terlalu gelap.
- Helper text dan metadata harus konsisten lebih kecil dari body.

### Suggested Scale

- Page title: `text-3xl`
- Section title: `text-lg` atau `text-xl`
- Subtitle: `text-sm`
- Table/body: `text-sm`
- Helper/meta: `text-xs`

## Layout Rules

### App Shell

- Sidebar ramping di desktop.
- Topbar tipis di atas konten.
- User profile di kanan atas topbar.
- Content area memakai ritme vertikal konsisten.
- Judul halaman dan subtitle wajib ada.

### Page Composition

Setiap halaman list idealnya mengikuti struktur:

1. `PageHeader`
2. `FilterToolbar`
3. `DataTableShell` atau `SectionCard`
4. Secondary section bila ada

## Shared Component Rules

## Wajib Shared

- `Topbar`
- `SidebarNav`
- `PageHeader`
- `FilterToolbar`
- `SectionCard`
- `StatCard`
- `ActionMenu`
- `DataTableShell`
- `FormSection`
- `EmptyState`

## Existing Components yang Wajib Direfactor

- `Button`
- `Badge`
- `Input`
- `Select`
- `Textarea`
- `Dialog`
- `Table`

## Button Rules

- Primary untuk aksi utama tunggal.
- Secondary untuk aksi pendamping.
- Ghost untuk aksi ringan.
- Danger hanya untuk aksi destruktif.
- Hindari banyak primary button dalam satu area yang sama.

## Badge Rules

- Badge harus kecil, lembut, dan informatif.
- Status jangan terlalu kontras.
- Gunakan varian semantic, bukan warna bebas.

## Table Rules

- Header ringan dan tipis.
- Border halus.
- Action row memakai `ActionMenu` (`...`).
- Metadata tambahan boleh di bawah label utama dalam ukuran kecil.
- Toolbar filter horizontal wajib untuk halaman list utama.

## Filter Toolbar Rules

- Search di kiri.
- Filter penting di tengah/kiri.
- CTA utama selalu di kanan atas.
- Bila filter banyak, gunakan wrap yang tetap rapi.

## Form Rules

- Form besar harus dibagi per section.
- Setiap section boleh punya judul dan helper.
- Field yang saling berkaitan harus dikelompokkan.
- Error text selalu di bawah field.
- Helper text singkat dan relevan.
- Jangan campur pesan sukses/error inline jika sudah memakai Sonner, kecuali ada kebutuhan khusus.

## Dialog Rules

- Dialog tetap cukup besar.
- Header jelas.
- Isi dialog dibagi section jika form kompleks.
- Footer action konsisten.

## Chart Rules

- Grid tipis dan clean.
- Gunakan palette pastel berbasis BPS blue family.
- Hindari chart terlalu ramai.
- Legend harus mudah dibaca.
- Label angka diprioritaskan jelas daripada dekoratif.

## Empty State Rules

- Gunakan icon/illustration ringan.
- Title jelas.
- Description singkat dan actionable.
- Jika relevan, sertakan CTA.

## Icon Rules

- Gunakan Font Awesome.
- Pilih satu style dominan agar konsisten.
- Icon untuk nav, action, state, dan empty state harus berasal dari sistem yang sama.
- Hindari mencampur outline dan solid tanpa aturan.

## Reuse and DRY Rules

- Jika lebih dari dua halaman punya pola toolbar sama, ekstrak.
- Jika lebih dari dua halaman punya pola header sama, ekstrak.
- Jika lebih dari dua halaman punya card stat sama, ekstrak.
- Jangan copy className panjang lintas halaman jika bisa jadi shared component.
- Prefer props dan variants daripada duplikasi file.

## Content Rules

- Semua halaman wajib punya judul dan subtitle.
- Copywriting boleh lebih singkat dan modern, tapi tetap formal internal.
- Bahasa UI tetap Bahasa Indonesia.

## Scope Prioritas

Prioritas implementasi:

1. desktop shell
2. shared components
3. dashboard utama
4. semua halaman list
5. form modular
6. visual polish

## Definition of Good UI untuk Proyek Ini

UI dianggap sesuai rule jika:

- terlihat ringan, bersih, dan profesional
- lebih dekat ke referensi tanpa kehilangan identitas SIMON PST
- semua halaman terasa satu sistem
- tidak ada komponen penting yang berdiri sendiri tanpa shared basis
- user bisa memahami struktur halaman dalam 3-5 detik pertama
