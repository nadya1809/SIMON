---
## project: SIMON PST (Sistem Monitoring Kinerja Petugas PST)
version: 0.3.0-draft
doc_type: PRD (Product Requirements Document)
stack:
framework: Next.js 14+ (App Router, TypeScript)
database: PostgreSQL
orm: Prisma
auth: NextAuth.js (Credentials provider)
styling: Tailwind CSS
charts: Recharts
status: DRAFT — pending confirmation, lihat §12 Open Questions sebelum mulai sprint
optimized_for: AI coding agent / vibe coding (Claude Code, Cursor, Windsurf, dll)
last_updated: 2026-06-23


# PRD: SIMON PST — Sistem Monitoring Kinerja Petugas Pelayanan Statistik Terpadu


>
> ⚠️ **Catatan asal dokumen.** PRD ini disusun ulang dari transkrip sesi requirement-gathering sebelumnya (bukan dari `SIMON PST Overview.pdf` aslinya, yang tidak ikut terbawa di file yang di-upload). Semua poin di §1 sudah **terkonfirmasi** dari jawaban Anda. Poin di luar itu adalah **asumsi default** yang ditandai 🔶 dan WAJIB dikonfirmasi — lihat §12.
>
---
## 0. Instruksi untuk AI Agent (baca ini dulu)

Jika Anda adalah AI coding agent yang menerima file ini sebagai konteks:

1. **Jangan mulai coding sebelum membaca §12 (Open Questions).** Item bertanda 🔶 adalah asumsi, bukan kebenaran final. Jika tidak ada jawaban manusia, gunakan default yang tertulis dan beri komentar `// ASSUMPTION:` di kode terkait.
2. **Schema di §7 dan kontrak API di §8 adalah sumber kebenaran (source of truth)** untuk struktur data — jangan improvisasi nama tabel/field baru tanpa alasan.
3. **Ikuti urutan build di §13 (Implementation Checklist)** — jangan mulai dari UI sebelum schema & auth jalan.
4. Semua *acceptance criteria* di §6 ditulis format Given/When/Then — jadikan ini dasar untuk test case.
5. Bahasa UI:  **Bahasa Indonesia** . Bahasa kode (variabel, fungsi, nama tabel):  **English** , konvensi camelCase (TS/Prisma) dan kebab-case (folder route).

---

## 1. Keputusan yang Sudah Terkonfirmasi (dari sesi sebelumnya)

| #  | Topik                             | Keputusan                                                                                                                                                                          |
| -- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Target pengguna sistem            | Admin BPS Pusat, Kepala Unit/Supervisor, Pimpinan/Manajemen BPS                                                                                                                    |
| 2  | Skala deployment                  | 1 kantor BPS saja (lokal/single-tenant)                                                                                                                                            |
| 3  | Prioritas fitur (ranking)         | 1) Penilaian Harian & Monitoring Kinerja → 2) Dashboard & Visualisasi Data → 3) Reward & Punishment + Laporan                                                                    |
| 4  | Role & permission                 | Semua user yang login mengakses fitur yang sama — termasuk Pimpinan (lihat #10, resolved)                                                                                         |
| 5  | Mekanisme input penilaian         | Harian — wajib diisi setiap hari kerja                                                                                                                                            |
| 6  | Akses login petugas (PST officer) | **Tidak bisa login.**Hanya Admin, Supervisor, & Pimpinan yang mengakses data penilaian                                                                                             |
| 7  | Formula penilaian                 | Skala 1–10 per kriteria:**hanya 2 kriteria — Disiplin & Kinerja**(final, tidak ada tambahan)                                                                               |
| 8  | Manajemen Komplain                | **OUT OF SCOPE.**Sudah ada sistem terpisah di luar SIMON PST                                                                                                                       |
| 9  | Format export laporan             | PDF & Excel                                                                                                                                                                        |
| 10 | Akses Pimpinan ke data penilaian  | **Full access**— sama seperti Admin/Supervisor (bisa input/edit, bukan read-only). Kontradiksi di §4 versi sebelumnya resolved.                                            |
| 11 | Mekanisme Reward & Punishment     | **Kombinasi** : sistem generate rekomendasi otomatis berdasarkan threshold skor → keputusan final tetap approval manual (Admin/Supervisor/Pimpinan)                         |
| 12 | Lokasi deployment                 | **On-premise** , dikelola sendiri oleh tim IT BPS. PRD ini tidak mengasumsikan provider cloud apa pun — lihat §9 & Appendix A untuk artefak deployment yang infra-agnostic |
| 13 | Petugas cuti/sakit di hari kerja  | **Wajib diisi**status "Tidak Hadir" (bukan di-skip) — lihat §7 untuk field `status`di schema                                                                             |
| 14 | Audit log                         | **Diperlukan**— sistem mencatat siapa mengubah data apa & kapan (lihat model `AuditLog`di §7)                                                                            |

---

## 2. Problem Statement & Solusi

| Sebelum (Problem)                                                           | Setelah (SIMON PST)                                       |
| --------------------------------------------------------------------------- | --------------------------------------------------------- |
| Penilaian kinerja harian petugas PST dicatat manual (kertas/Excel terpisah) | Input terstruktur, satu sumber data, per petugas per hari |
| Supervisor sulit memantau tren kinerja & komplain dari waktu ke waktu       | Dashboard & visualisasi data real-time                    |
| Reward/punishment ditentukan subjektif tanpa data historis                  | Rekomendasi berbasis skor agregat dengan jejak data       |
| Laporan ke Pimpinan dibuat manual, lambat                                   | Export PDF/Excel sesuai periode, dalam hitungan detik     |

**Bukan tujuan sistem ini:** mengelola komplain masyarakat (sudah ada sistem lain), dan tidak memberi akses login ke petugas yang dinilai.

---

## 3. Goals & Success Metrics (KPI) 🔶

| Metrik                                  | Target                                                         | Catatan                                   |
| --------------------------------------- | -------------------------------------------------------------- | ----------------------------------------- |
| Kepatuhan pengisian penilaian harian    | ≥ 95% hari kerja terisi per bulan                             | Perlu reminder/notifikasi — lihat §12.5 |
| Waktu generate dashboard (data 1 bulan) | < 3 detik                                                      |                                           |
| Waktu export laporan (PDF/Excel)        | < 30 detik                                                     | Sesuai target dokumen asli                |
| Uptime sistem (jam kerja)               | ≥ 99%                                                         |                                           |
| Adopsi Supervisor aktif                 | 100% supervisor menggunakan sistem dalam bulan pertama go-live |                                           |

---

## 4. Users & Roles

| Role                               | Bisa Login?             | Akses Data Penilaian                                                                   | Catatan                                                     |
| ---------------------------------- | ----------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Admin (BPS Pusat)**        | ✅                      | Full (input, edit, lihat semua)                                                        | Kelola master data: petugas, kriteria, akun user            |
| **Supervisor (Kepala Unit)** | ✅                      | Full (input, edit, lihat semua)                                                        | Menilai petugas harian                                      |
| **Pimpinan/Manajemen**       | ✅                      | **Full**(input, edit, lihat semua) — dikonfirmasi sama seperti Admin/Supervisor | Tidak ada pembatasan akses dibanding 2 role lain            |
| **Petugas PST**              | ❌**Tidak login** | Tidak ada akses sama sekali                                                            | Hanya jadi*data subject*— dinilai, bukan pengguna sistem |

> **Catatan implementasi:** Karena Admin, Supervisor, dan Pimpinan punya permission identik, secara teknis `Role` enum tetap dipertahankan (untuk audit/label di UI dan kemungkinan diferensiasi di masa depan), tapi middleware authorization saat ini **tidak perlu role-based restriction** untuk endpoint data penilaian — cukup "harus login" (`isAuthenticated`). Jangan over-engineer permission matrix untuk kondisi saat ini.

---

## 5. Scope

### 5.1 In Scope

* Input & manajemen penilaian harian petugas (skala 1–10 per kriteria)
* Manajemen master data petugas (CRUD)
* Manajemen master data kriteria penilaian (CRUD, agar fleksibel tanpa ubah kode)
* Dashboard & visualisasi tren kinerja (per petugas, per unit, per periode)
* Rekomendasi & pencatatan Reward/Punishment berbasis skor
* Export laporan PDF & Excel
* Autentikasi & role-based access (Admin, Supervisor, Pimpinan)

### 5.2 Out of Scope

* ❌ Manajemen komplain masyarakat (sistem terpisah sudah ada)
* ❌ Login/akses untuk petugas PST yang dinilai
* ❌ Integrasi multi-kantor/multi-region (skala saat ini: 1 kantor)
* ❌ Mobile app native (web responsive saja, kecuali diputuskan lain — §12.8)

---

## 6. Functional Requirements

### 6.1 Penilaian Harian (Daily Assessment) — **P1**

**User Story:** Sebagai Supervisor, saya ingin menginput nilai harian petugas per kriteria agar kinerja terekam secara konsisten.

**Business Rules:**

* 1 petugas hanya boleh punya **1 record penilaian per hari** (unique constraint `officerId + assessmentDate`).
* Kriteria penilaian **final: 2 kriteria — Disiplin & Kinerja** (lihat §1 #7). Tabel `Criteria` tetap dipertahankan untuk fleksibilitas, tapi seed hanya 2 baris ini.
* Skor per kriteria: integer 1–10.
* `averageScore` = rata-rata semua skor kriteria pada record tersebut (dihitung otomatis, jangan diinput manual).
* Admin, Supervisor, dan Pimpinan semua bisa create/edit (akses identik — dikonfirmasi, lihat §4).
* **Wajib diisi status kehadiran setiap hari kerja** (dikonfirmasi, §1 #13). Field `status`: `PRESENT` atau `ABSENT`. Jika `ABSENT`, skor kriteria tidak diisi (`averageScore` = `null`), tapi record tetap wajib dibuat agar kepatuhan pengisian (§3 KPI) terhitung akurat.

**Acceptance Criteria:**

```gherkin
Given Supervisor sudah login dan memilih petugas + tanggal hari ini
When Supervisor mengisi skor untuk setiap kriteria aktif dan submit
Then sistem menyimpan record DailyAssessment baru dengan averageScore terhitung otomatis
And jika record untuk officerId + tanggal tersebut sudah ada, sistem menolak submit (validation error)

Given Supervisor mencoba submit skor di luar rentang 1-10
When form divalidasi
Then sistem menampilkan error dan tidak menyimpan data

Given petugas tidak hadir (cuti/sakit) pada hari kerja
When Supervisor memilih status "Tidak Hadir" untuk petugas tersebut
Then sistem menyimpan record DailyAssessment dengan status ABSENT dan averageScore null,
     TANPA mewajibkan input skor kriteria
```

### 6.2 Dashboard & Visualisasi — **P1**

**User Story:** Sebagai Supervisor/Pimpinan, saya ingin melihat tren skor kinerja agar bisa mengambil keputusan cepat.

**Acceptance Criteria:**

```gherkin
Given user memilih rentang tanggal dan/atau unit tertentu
When dashboard dimuat
Then sistem menampilkan: rata-rata skor per petugas, tren skor harian/mingguan/bulanan (line chart),
     dan ranking petugas berdasarkan skor (tabel terurut)

Given tidak ada data penilaian pada rentang tanggal yang dipilih
When dashboard dimuat
Then sistem menampilkan empty state yang jelas, bukan error
```

🔶 Detail komponen dashboard (ranking, distribusi per kriteria, perbandingan unit) — lihat §12.6 untuk konfirmasi prioritas.

### 6.3 Reward & Punishment — **P2**

**User Story:** Sebagai Pimpinan, saya ingin sistem merekomendasikan petugas untuk reward/punishment berdasarkan skor agregat, agar keputusan berbasis data.

✅  **Mekanisme terkonfirmasi** : rekomendasi otomatis + approval manual (lihat §1 #11). 🔶 **Threshold angka pastinya** masih default asumsi (lihat §12.3):

* Default: rata-rata skor bulanan **≥ 8.0** → kandidat reward; **≤ 4.0** → kandidat punishment.
* Sistem generate rekomendasi otomatis; keputusan final tetap **manual** (status `RECOMMENDED → APPROVED/REJECTED` oleh Admin/Supervisor/Pimpinan — semua role sekarang punya akses approval yang sama).

**Acceptance Criteria:**

```gherkin
Given periode bulanan berakhir dan rata-rata skor petugas dihitung
When skor memenuhi threshold reward atau punishment
Then sistem membuat record RewardPunishment dengan status RECOMMENDED

Given record RewardPunishment berstatus RECOMMENDED
When Pimpinan/Admin menekan "Approve" atau "Reject"
Then status berubah sesuai aksi, dan decidedBy + decidedAt tercatat
```

### 6.4 Laporan & Export — **P2**

**User Story:** Sebagai Pimpinan, saya ingin mengunduh laporan kinerja dalam PDF/Excel untuk rentang tanggal tertentu.

**Acceptance Criteria:**

```gherkin
Given user memilih rentang tanggal dan format (PDF atau Excel)
When user menekan "Export"
Then sistem generate file berisi: nama petugas, skor per kriteria, average score, dan ranking
And proses selesai dalam < 30 detik untuk data 1 bulan
```

### 6.5 Manajemen Master Data — **P1**

CRUD untuk: Petugas (Officer), Kriteria Penilaian (Criteria), Akun User (Admin only — Supervisor & Pimpinan accounts diprovision oleh Admin, 🔶 lihat §12.7 soal self-register vs manual).

### 6.6 Autentikasi — **P1**

🔶 Default: NextAuth.js Credentials provider (email + password, bcrypt hash). Lihat §12.9 jika BPS punya sistem SSO internal yang harus diintegrasikan.

---

## 7. Data Model

```mermaid
erDiagram
  USER ||--o{ DAILY_ASSESSMENT : "menilai (assessor)"
  USER ||--o{ REWARD_PUNISHMENT : "memutuskan"
  USER ||--o{ AUDIT_LOG : "melakukan aksi"
  UNIT ||--o{ OFFICER : "memiliki"
  OFFICER ||--o{ DAILY_ASSESSMENT : "dinilai"
  OFFICER ||--o{ REWARD_PUNISHMENT : "menerima"
  DAILY_ASSESSMENT ||--o{ ASSESSMENT_SCORE : "terdiri dari"
  CRITERIA ||--o{ ASSESSMENT_SCORE : "dipakai pada"

  USER {
    string id PK
    string name
    string email
    string passwordHash
    enum role "ADMIN | SUPERVISOR | PIMPINAN"
    boolean isActive
  }
  UNIT {
    string id PK
    string name
  }
  OFFICER {
    string id PK
    string nip
    string name
    string position
    string unitId FK
    boolean isActive
  }
  CRITERIA {
    string id PK
    string name
    int sortOrder
    boolean isActive
  }
  DAILY_ASSESSMENT {
    string id PK
    string officerId FK
    string assessorId FK
    date assessmentDate
    enum status "PRESENT | ABSENT"
    float averageScore "nullable jika ABSENT"
    string notes
  }
  ASSESSMENT_SCORE {
    string id PK
    string dailyAssessmentId FK
    string criteriaId FK
    int score "1-10"
  }
  REWARD_PUNISHMENT {
    string id PK
    string officerId FK
    enum type "REWARD | PUNISHMENT"
    string category
    date periodStart
    date periodEnd
    float triggerScore
    enum status "RECOMMENDED | APPROVED | REJECTED"
    string decidedById FK
  }
  AUDIT_LOG {
    string id PK
    string userId FK
    string action "CREATE | UPDATE | DELETE"
    string entity "nama model, misal DailyAssessment"
    string entityId
    json beforeData
    json afterData
    datetime createdAt
  }
```

### Prisma Schema (source of truth)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  SUPERVISOR
  PIMPINAN
}

enum RewardPunishmentType {
  REWARD
  PUNISHMENT
}

enum RewardPunishmentStatus {
  RECOMMENDED
  APPROVED
  REJECTED
}

enum AttendanceStatus {
  PRESENT
  ABSENT
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
}

model User {
  id           String    @id @default(cuid())
  name         String
  email        String    @unique
  passwordHash String
  role         Role
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  assessments  DailyAssessment[]  @relation("Assessor")
  decisions    RewardPunishment[] @relation("DecidedBy")
  auditLogs    AuditLog[]
}

model Unit {
  id          String    @id @default(cuid())
  name        String
  description String?
  officers    Officer[]
}

model Officer {
  id        String    @id @default(cuid())
  nip       String    @unique
  name      String
  position  String?
  unitId    String?
  unit      Unit?     @relation(fields: [unitId], references: [id])
  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now())

  assessments       DailyAssessment[]
  rewardPunishments RewardPunishment[]
}

model Criteria {
  id          String   @id @default(cuid())
  name        String
  description String?
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)

  scores AssessmentScore[]
}

model DailyAssessment {
  id             String           @id @default(cuid())
  officerId      String
  officer        Officer          @relation(fields: [officerId], references: [id])
  assessorId     String
  assessor       User             @relation("Assessor", fields: [assessorId], references: [id])
  assessmentDate DateTime         @db.Date
  status         AttendanceStatus @default(PRESENT)
  averageScore   Float?           // null jika status = ABSENT
  notes          String?
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  scores AssessmentScore[]

  @@unique([officerId, assessmentDate])
}

model AssessmentScore {
  id                String          @id @default(cuid())
  dailyAssessmentId String
  dailyAssessment   DailyAssessment @relation(fields: [dailyAssessmentId], references: [id], onDelete: Cascade)
  criteriaId        String
  criteria          Criteria        @relation(fields: [criteriaId], references: [id])
  score             Int

  @@unique([dailyAssessmentId, criteriaId])
}

model RewardPunishment {
  id           String                 @id @default(cuid())
  officerId    String
  officer      Officer                @relation(fields: [officerId], references: [id])
  type         RewardPunishmentType
  category     String
  periodStart  DateTime               @db.Date
  periodEnd    DateTime               @db.Date
  triggerScore Float
  status       RewardPunishmentStatus @default(RECOMMENDED)
  decidedById  String?
  decidedBy    User?                  @relation("DecidedBy", fields: [decidedById], references: [id])
  decidedAt    DateTime?
  notes        String?
  createdAt    DateTime               @default(now())
}

model AuditLog {
  id         String      @id @default(cuid())
  userId     String
  user       User        @relation(fields: [userId], references: [id])
  action     AuditAction
  entity     String      // nama model yang diubah, misal "DailyAssessment"
  entityId   String
  beforeData Json?
  afterData  Json?
  createdAt  DateTime    @default(now())

  @@index([entity, entityId])
}
```

---

## 8. API Design (Next.js App Router)

| Method               | Endpoint                                          | Fungsi                                                 | Role                                    |
| -------------------- | ------------------------------------------------- | ------------------------------------------------------ | --------------------------------------- |
| `POST`             | `/api/auth/[...nextauth]`                       | Login/session (NextAuth)                               | All                                     |
| `GET/POST`         | `/api/officers`                                 | List / create petugas                                  | Admin                                   |
| `GET/PATCH/DELETE` | `/api/officers/[id]`                            | Detail / edit / nonaktifkan petugas                    | Admin                                   |
| `GET/POST`         | `/api/criteria`                                 | List / create kriteria                                 | Admin                                   |
| `GET/PATCH`        | `/api/criteria/[id]`                            | Edit / nonaktifkan kriteria                            | Admin                                   |
| `GET/POST`         | `/api/assessments`                              | List (filter date/officer) / create penilaian harian   | Admin, Supervisor                       |
| `GET/PATCH`        | `/api/assessments/[id]`                         | Detail / edit penilaian                                | Admin, Supervisor                       |
| `GET`              | `/api/dashboard/summary`                        | Data agregat untuk dashboard (query: from, to, unitId) | All                                     |
| `GET/POST`         | `/api/reward-punishment`                        | List / generate rekomendasi                            | All (view), Admin/Supervisor (generate) |
| `PATCH`            | `/api/reward-punishment/[id]`                   | Approve/reject                                         | Pimpinan, Admin                         |
| `GET`              | `/api/reports/export?format=pdf\|xlsx&from=&to=` | Generate & download laporan                            | All                                     |
| `GET/POST`         | `/api/users`                                    | List / create akun (Admin, Supervisor, Pimpinan)       | Admin                                   |

### Struktur Folder (App Router)

```
src/
  app/
    (auth)/
      login/page.tsx
    (dashboard)/
      layout.tsx                # shell + sidebar, role-aware nav
      dashboard/page.tsx
      assessments/
        page.tsx                # list + filter
        new/page.tsx            # form input harian
        [id]/page.tsx           # edit
      officers/
        page.tsx
        [id]/page.tsx
      reward-punishment/page.tsx
      reports/page.tsx
      settings/
        criteria/page.tsx
        users/page.tsx
    api/
      auth/[...nextauth]/route.ts
      officers/route.ts
      officers/[id]/route.ts
      criteria/route.ts
      criteria/[id]/route.ts
      assessments/route.ts
      assessments/[id]/route.ts
      dashboard/summary/route.ts
      reward-punishment/route.ts
      reward-punishment/[id]/route.ts
      reports/export/route.ts
      users/route.ts
  lib/
    prisma.ts
    auth.ts
    validations/            # Zod schemas per entity
    scoring.ts              # logika hitung averageScore, threshold reward/punishment
    audit.ts                # Prisma middleware/wrapper untuk tulis AuditLog otomatis
  components/
    ui/                     # primitives (button, input, table, dst.)
    forms/
    charts/
  types/
prisma/
  schema.prisma
  seed.ts
```

---

## 9. Tech Stack 🔶 (default — bisa diubah, lihat §12.10)

| Layer        | Pilihan                                                           | Alasan                                                                                    |
| ------------ | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Framework    | Next.js 14+ (App Router, TypeScript)                              | Sesuai permintaan                                                                         |
| Database     | PostgreSQL                                                        | Sesuai permintaan                                                                         |
| ORM          | Prisma                                                            | Type-safe, migration mudah, cocok untuk vibe coding                                       |
| Auth         | NextAuth.js (Credentials)                                         | Standar Next.js, mudah ganti ke SSO nanti                                                 |
| Styling      | Tailwind CSS                                                      | Cepat untuk AI-assisted scaffolding                                                       |
| Validasi     | Zod + React Hook Form                                             | Validasi konsisten client & server                                                        |
| Chart        | Recharts                                                          | Ringan, komponen siap pakai                                                               |
| Export PDF   | `@react-pdf/renderer`                                           | Render PDF dari komponen React                                                            |
| Export Excel | `exceljs`                                                       | Format & styling cell didukung                                                            |
| Deployment   | **On-premise** , dikelola tim IT BPS sendiri (dikonfirmasi) | Tanpa Docker — install langsung di server (Node.js + PostgreSQL + PM2), lihat Appendix A |

---

## 10. Non-Functional Requirements

* **Security:** password di-hash (bcrypt), semua route API diproteksi middleware role-check, HTTPS wajib di production.
* **Reliability:** backup database harian (🔶 mekanisme backup spesifik belum dikonfirmasi — tanyakan ke tim IT BPS yang akan mengelola server), target uptime ≥99% di jam kerja.
* **Deployment & Infrastructure:** Aplikasi  **on-premise** , dikelola tim IT BPS, **tanpa Docker** — install langsung di server (Node.js 20+, PostgreSQL, PM2 untuk process management). Lihat Appendix A.
* **Usability:** UI berbahasa Indonesia, responsive (desktop & tablet — prioritas desktop karena dipakai admin/supervisor di kantor).
* **Maintainability:** TypeScript strict mode, ESLint + Prettier, struktur folder konsisten dengan §8.
* **Audit Trail:** ✅ **Diperlukan** (dikonfirmasi, §1 #14). Setiap create/update/delete pada `DailyAssessment` dan `RewardPunishment` wajib tercatat di model `AuditLog` (siapa, kapan, data sebelum/sesudah). Implementasikan via Prisma middleware (`$use`) atau wrapper service, bukan manual di setiap route handler, agar tidak ada yang terlewat.
* **Scalability:** didesain untuk 1 kantor, tapi schema (`Unit`) sudah disiapkan agar mudah extend ke multi-unit/multi-kantor di masa depan.

---

## 11. Roadmap (MVP — estimasi 8–10 minggu)

| Fase                                            | Durasi      | Output                                                                         |
| ----------------------------------------------- | ----------- | ------------------------------------------------------------------------------ |
| **Fase 1 — Fondasi**                     | 1–2 minggu | Setup project, schema Prisma, auth, seed master data (Unit, Criteria, Officer) |
| **Fase 2 — Penilaian Harian**            | 2 minggu    | CRUD Officer & Criteria, form input penilaian, business rules §6.1            |
| **Fase 3 — Dashboard**                   | 2 minggu    | Visualisasi tren, ranking, filter periode/unit                                 |
| **Fase 4 — Reward/Punishment & Laporan** | 2 minggu    | Rekomendasi otomatis, approval flow, export PDF/Excel                          |
| **Fase 5 — Polish & Deploy**             | 1–2 minggu | Testing, audit log, deployment                                                 |

---

## 12. Open Questions — **WAJIB DIJAWAB SEBELUM/SELAMA SPRINT 1**

> ✅ Resolved: akses Pimpinan (§1 #10), mekanisme reward/punishment (§1 #11), lokasi deployment (§1 #12), status kehadiran (§1 #13), audit log (§1 #14), kriteria penilaian final 2 kriteria (§1 #7).

### 12.3 Threshold angka Reward & Punishment

Mekanisme sudah confirmed (rekomendasi otomatis + approval manual). Yang masih perlu: **angka pasti threshold-nya** — berapa skor rata-rata bulanan yang memicu rekomendasi reward? Berapa yang memicu punishment? Reward/punishment berupa apa secara konkret (SP1/SP2, sertifikat, bonus, dll) — perlu dicatat detail atau cukup status? perlu di catat

### 12.5 Notifikasi/Reminder

Apakah perlu reminder otomatis (email/WhatsApp) untuk Supervisor yang belum mengisi penilaian harian? Jika ya, jam berapa & channel apa? tidak perlu

### 12.6 Detail Dashboard

Selain tren & ranking, apakah perlu: perbandingan antar unit, distribusi skor per kriteria, atau breakdown lain? perlu

### 12.7 Provisioning akun

Akun Supervisor/Pimpinan dibuat manual oleh Admin, atau ada mekanisme self-register dengan approval? dibuat manual oleh admin

### 12.8 Mobile / PWA

Apakah perlu diakses dari HP (PWA/responsive penuh), atau cukup desktop saja karena dipakai di kantor? tidak perlu

### 12.9 Integrasi sistem lain

Apakah perlu integrasi SSO BPS, data pegawai dari SIMPEG, atau sistem komplain yang sudah ada (sekadar link, atau API)?  tidak

### 12.10 Perubahan tech stack

Apakah stack di §9 (Prisma, NextAuth, Tailwind, Recharts) disetujui, atau ada preferensi lain (misal sudah ada standar internal BPS)? iya setuju, pakai db postgres sql yahh 

### 12.13 Estimasi skala

Berapa kira-kira jumlah petugas PST yang akan dinilai? (untuk sizing database & dashboard, meski skala 1 kantor biasanya kecil). buatkan saja modul petugas pstnya biar saya input siapa aja petugasnya soalnya ada 40 orang lebih

---

## 13. Implementation Checklist (untuk AI Agent)

```
[ ] 1. Init project: npx create-next-app@latest simon-pst --typescript --tailwind --app
[ ] 2. Install deps: prisma @prisma/client next-auth bcryptjs zod react-hook-form
                      @hookform/resolvers recharts exceljs @react-pdf/renderer
[ ] 3. npx prisma init → tempel schema dari §7 → npx prisma migrate dev
[ ] 4. Buat prisma/seed.ts: seed Unit, 2 Criteria (Disiplin, Kinerja — final, lihat §1 #7), 1 Admin user
[ ] 5. Setup NextAuth (lib/auth.ts) — Credentials provider, JWT session dengan field role
[ ] 6. Buat middleware "harus login" untuk /api/* dan /(dashboard)/* (TANPA role-restriction — semua role akses sama, lihat §4)
[ ] 7. Buat lib/audit.ts (Prisma middleware `$use`) — wajib jalan SEBELUM fitur lain ditulis, agar semua CRUD otomatis tercatat ke AuditLog
[ ] 8. CRUD Officer + Criteria (API + UI) — selesaikan SEBELUM lanjut ke penilaian
[ ] 9. Form input Daily Assessment + validasi business rules §6.1 (termasuk toggle status PRESENT/ABSENT)
[ ] 10. Dashboard: summary endpoint + chart components (Recharts)
[ ] 11. Reward/Punishment: scoring.ts (logika threshold dari §12.3, default §6.3 jika belum dijawab) + approval flow
[ ] 12. Export PDF (@react-pdf/renderer) & Excel (exceljs)
[ ] 13. Test acceptance criteria di §6 sebagai test case
[ ] 14. Siapkan server: install Node.js 20+, PostgreSQL, PM2 (lihat Appendix A — tanpa Docker)
[ ] 15. Deploy on-premise (dikelola tim IT BPS — di luar scope AI agent)
```

---

## Appendix A: Deployment On-Premise (Tanpa Docker)

Deployment dikelola sendiri oleh tim IT BPS, langsung di server (VM/fisik) tanpa containerization — install Node.js & PostgreSQL langsung di OS server.

**Prasyarat di server:**

* Node.js 20+ LTS
* PostgreSQL 16+ (terinstall & jalan sebagai service)
* PM2 (`npm install -g pm2`) — untuk menjaga aplikasi tetap jalan & auto-restart

**`.env`** (di server, jangan commit ke repo):

```
DATABASE_URL="postgresql://simon_user:CHANGE_ME@localhost:5432/simon_pst"
NEXTAUTH_SECRET="generate-dengan: openssl rand -base64 32"
NEXTAUTH_URL="https://domain-internal-bps-anda"
```

**Langkah build & jalankan:**

```bash
# 1. Setup database (sekali saja)
sudo -u postgres psql -c "CREATE USER simon_user WITH PASSWORD 'CHANGE_ME';"
sudo -u postgres psql -c "CREATE DATABASE simon_pst OWNER simon_user;"

# 2. Clone/pull kode ke server, lalu:
npm ci
npx prisma migrate deploy
npx prisma db seed
npm run build

# 3. Jalankan dengan PM2 (auto-restart jika crash/server reboot)
pm2 start npm --name "simon-pst" -- start
pm2 save
pm2 startup    # generate command agar PM2 auto-start saat server reboot
```

**Update aplikasi di kemudian hari:**

```bash
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 restart simon-pst
```

> Serahkan ke tim IT BPS: reverse proxy (Nginx) untuk routing domain internal + HTTPS, jadwal `pg_dump` untuk backup database harian, dan firewall rules. Itu di luar scope PRD ini — cukup pastikan port aplikasi (default 3000) hanya bisa diakses lewat reverse proxy, bukan langsung dari luar.

---

## 14. Glossary

| Istilah               | Arti                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **BPS**         | Badan Pusat Statistik — lembaga statistik nasional Indonesia                                                                  |
| **PST**         | Pelayanan Statistik Terpadu — unit layanan satu pintu BPS untuk publik (konsultasi data, perpustakaan, rekomendasi statistik) |
| **SIMON PST**   | Sistem Informasi Monitoring (kinerja) petugas PST — objek PRD ini                                                             |
| **Petugas PST** | Pegawai yang bertugas melayani publik di loket/unit PST — dinilai oleh sistem ini, tidak punya akun login                     |
| **NIP**         | Nomor Induk Pegawai — ID unik PNS/ASN Indonesia                                                                               |

---

*Akhir dokumen. Versi ini adalah draft yang siap untuk development paralel dengan klarifikasi §12 — bagian yang ditandai 🔶 sudah punya default yang aman untuk mulai coding, tapi jangan finalize logika bisnis terkait sebelum dikonfirmasi.*
