# Global UI Refactor Plan

## Tujuan

Merapikan seluruh modul agar:

- bug warna/filter tidak muncul lagi
- komponen berulang diekstrak menjadi shared component
- UI konsisten di semua modul
- fondasi `shadcn/ui` bisa dipakai bertahap tanpa merusak flow yang sudah ada

## Status Saat Ini

- Fondasi `shadcn/ui` sudah diinisialisasi
- `components.json` sudah tersedia
- `Select` shared sudah distabilkan agar tidak mengikuti styling native browser/OS
- token warna SIMON di `globals.css` sudah dikunci ulang agar tetap konsisten
- kompatibilitas `Button` lama tetap dipertahankan supaya modul existing tidak pecah
- Fase 1 sudah diimplementasikan pada primitive shared utama

## Masalah Utama Yang Harus Diselesaikan

1. Banyak modul masih memakai pola filter yang mirip tetapi ditulis ulang di masing-masing file.
2. Primitive UI seperti `Select`, `Button`, `Dialog`, `Table`, dan `EmptyState` belum sepenuhnya disatukan.
3. Beberapa halaman masih menggabungkan logic data, layout, dan presentational UI dalam satu file besar.
4. Warna dan struktur visual sudah mendekati seragam, tetapi belum sepenuhnya DRY.

## Prioritas Eksekusi

### [x] Fase 1: Stabilkan Primitive Shared

Target:

- `Button`
- `Select`
- `Input`
- `Textarea`
- `ModalDialog`
- `DataTableShell`
- `FilterToolbar`
- `StatCard`
- `AccentSummaryPanel`

Output:

- semua primitive punya API yang stabil
- semua modul memakai primitive yang sama
- tidak ada styling ad-hoc yang bentrok dengan token global

Status implementasi:

- selesai
- style control dasar sudah diekstrak ke shared primitive styles
- shell table dan modal sudah punya slot class tambahan untuk reuse bertahap
- stat card dan accent summary panel sudah memakai token shared yang sama

### [x] Fase 2: Ekstrak Komponen Filter Global

Target:

- filter waktu + unit
- filter status
- filter pencarian
- tombol reset
- indikator filter auto-applied

Calon shared component:

- `ModuleFilters`
- `FilterSelect`
- `FilterSearchInput`
- `FilterResetButton`
- `FilterStatusHint`

Output:

- dashboard, reports, assessments, reward-punishment, officers memakai pola filter yang sama

Status implementasi:

- selesai
- `TimeUnitFilters` sudah menjadi shared filter utama untuk `dashboard` dan `reports`
- filter search/select/reset pada `assessments`, `reward-punishment`, dan `officers` sudah memakai `ModuleFilters`
- toolbar aksi informatif pada `users`, `criteria`, dan `units` sudah diseragamkan dengan wrapper global yang sama

### [x] Fase 3: Ekstrak Komponen Tabel dan State

Target:

- header tabel
- empty state
- loading state
- pagination
- row info block

Calon shared component:

- `ModuleTableSection`
- `ModuleEmptyState`
- `ModuleLoadingState`
- `ModulePagination`
- `EntityIdentityCell`

Output:

- semua halaman data-entry dan listing terasa sebagai satu sistem

Status implementasi:

- selesai
- `ModuleTableSection` sudah menjadi wrapper shared untuk shell tabel, header, dan empty state
- `ModulePagination` sudah dipakai untuk daftar yang memiliki pagination agar pola footer tabel konsisten
- `EntityIdentityCell` sudah dipakai untuk row info petugas pada `dashboard`, `reports`, `assessments`, `officers`, dan `reward-punishment`
- empty state dan loading state tetap memakai primitive shared yang sama agar loaded state dan loading state tetap satu bahasa visual

### [x] Fase 4: Pecah Halaman Besar Menjadi Presentational Section

Target modul:

- `assessments`
- `reward-punishment`
- `officers`
- `users`
- `criteria`
- `units`
- `reports`

Tujuan:

- pisahkan logic state/fetch dari section UI
- buat section reusable
- kecilkan file yang terlalu besar

Status implementasi:

- selesai
- section listing/filter/pagination untuk `assessments` sudah dipindah ke `assessment-list-section.tsx`
- section listing/filter/summary untuk `reward-punishment` sudah dipindah ke `recommendation-list-section.tsx`
- section listing/filter/pagination untuk `officers` sudah dipindah ke `officer-list-section.tsx`
- modal form assessment sudah dipindah ke `assessment-form-dialog.tsx`
- modal detail keputusan reward-punishment sudah dipindah ke `recommendation-detail-dialog.tsx`
- modal riwayat penilaian petugas sudah dipindah ke `officer-history-dialog.tsx`
- modal form officer sudah dipindah ke `officer-form-dialog.tsx`
- modal generate reward-punishment sudah dipindah ke `recommendation-generate-dialog.tsx`
- container utama modul besar sekarang lebih fokus ke state, fetch, mutation, dan orchestration UI

### [x] Fase 5: Migrasi Bertahap ke Shadcn-Compatible Pattern

Catatan:

- tidak migrasi sekaligus
- mulai dari komponen yang paling aman
- pertahankan token SIMON sebagai design system utama

Urutan aman:

1. `Select`
2. `Dialog` / modal
3. `Form` helpers
4. `Table` wrappers
5. state components seperti loading dan empty state

Status implementasi:

- selesai
- primitive `Dialog` sudah diganti ke fondasi Radix yang lebih shadcn-compatible di `src/components/ui/dialog.tsx`
- `ModalDialog` sekarang menjadi wrapper SIMON di atas primitive `Dialog` baru tanpa mengubah tampilan utama
- helper form di `src/components/forms/form-field.tsx` sudah ditingkatkan dengan struktur `FieldRoot`, `FieldHeader`, `FieldLabel`, `FieldHint`, `FieldError`, dan `FieldGroup`
- `Input`, `Textarea`, dan `Select` sudah diberi fondasi `data-slot` serta state `aria-invalid` agar lebih siap ke pattern form shadcn-compatible
- `Table` sekarang punya primitive composable (`TableContainer`, `TableRoot`, `TableHead`, `TableBody`, `TableRow`, `TableHeaderCell`, `TableCell`) sambil tetap mempertahankan wrapper lama
- state bersama sekarang memakai primitive `Skeleton` global dan struktur slot pada `LoadingState`, `EmptyState`, serta `DataTableShell`
- loading halaman laporan ikut dirapikan agar memakai fondasi skeleton yang sama dengan komponen shared lainnya

### [x] Fase 6: Seragamkan Pattern Dialog Form Lintas Modul

Target:

- header mode tambah/edit
- action bar simpan/batal
- toggle status boolean
- pattern modal form CRUD yang dipakai berulang

Calon shared component:

- `FormDialogHeader`
- `FormDialogActions`
- `BooleanStatusField`

Output:

- modal form di berbagai modul memakai struktur dan perilaku yang sama
- pengulangan markup tombol status dan header edit berkurang
- UI form lebih konsisten tanpa mengubah logika submit masing-masing modul

Status implementasi:

- selesai
- `FormDialogHeader` dipakai untuk menyeragamkan badge mode tambah/edit dan tombol batal edit
- `FormDialogActions` dipakai untuk menyeragamkan tombol simpan dan batal di dialog form
- `BooleanStatusField` dipakai pada form `users`, `criteria`, dan `officers`
- dialog form `assessment`, `officer`, `user`, `unit`, dan `criteria` sekarang memakai helper shared yang sama untuk area aksi utama

## Urutan Audit Modul

1. `dashboard`
2. `reports`
3. `assessments`
4. `reward-punishment`
5. `officers`
6. `users`
7. `units`
8. `criteria`

## Rules Refactor

- jangan tambah warna baru kalau token lama masih cukup
- semua modul harus pakai token global
- utamakan shared component daripada copy-paste markup
- pertahankan perilaku fitur yang sudah jalan
- refactor bertahap, selalu cek `tsc` dan `lint` setelah perubahan besar

## Checklist Verifikasi Setiap Fase

- `pnpm exec tsc --noEmit`
- `pnpm lint`
- cek visual mode terang
- cek visual mode gelap
- cek filter waktu dan filter unit
- cek loading state vs loaded state
- cek responsive desktop dan mobile dasar

## Next Step Yang Disarankan

Lanjut ke Fase 7:

- ekstrak dialog form `users`, `units`, dan `criteria` ke file presentational terpisah seperti pola `assessment-form-dialog.tsx` dan `officer-form-dialog.tsx`
- audit semua `ConfirmDialog` yang masih punya copy dan wiring mirip agar bisa dipakai lewat helper global
- terus kecilkan container modul agar fokus hanya pada state, fetch, mutation, dan orchestration
